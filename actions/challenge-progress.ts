"use server";

import db from "@/db/drizzle";
import { getUserProgress, checkSubscriptionStatus } from "@/db/queries";
import {
  challengeOptions,
  challengeProgress,
  challenges,
  courses,
  lessons,
  lessonCompletionBonuses,
  units,
  schools,
  userProgress,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerUser } from "@/lib/auth";
import { updateDailyStreak } from "./daily-streak";
import { SCORING_SYSTEM } from "@/constants";
import { applyTimeBonus } from "@/lib/time-bonus";
import { updateChallengeProgress } from "./daily-challenges";
import { logActivity } from "@/lib/activity-logger";
import { classifyPointsSubmission } from "@/lib/api-limits";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit-db";
import { logger } from "@/lib/logger";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  isChallengeAnswerShape,
  validateChallengeAnswer,
  type ChallengeAnswer,
} from "@/lib/validate-challenge-answer";

/**
 * Puan değişen her yazma yolundan sonra çağrılır. `revalidatePath` Next
 * sayfa cache'ini boşaltır ama `unstable_cache` ile etiketli DB sorguları
 * (leaderboard, userRank, schoolLeaderboard) yalnızca `revalidateTag` ile
 * tazelenir. Her ikisini birden çağırmak "1. sıradayım sandım, değildim"
 * stale-cache sürprizini engeller.
 */
function bustPointsCaches(userId: string, schoolChanged: boolean): void {
  revalidateTag(CACHE_TAGS.leaderboard);
  revalidateTag(CACHE_TAGS.userRank(userId));
  if (schoolChanged) revalidateTag(CACHE_TAGS.schoolLeaderboard);
}

const log = logger.child({ labels: { module: "actions/challenge-progress" } });

/**
 * Thrown when a point-awarding action rejects its input. Strings are safe
 * to surface to the UI; sensitive data never goes in the message.
 */
class PointsValidationError extends Error {
  readonly code: "invalid" | "over_cap" | "rate_limited";
  constructor(code: "invalid" | "over_cap" | "rate_limited", message: string) {
    super(message);
    this.name = "PointsValidationError";
    this.code = code;
  }
}

/** Puan oyunu/ödül/ceza hareketi; günlük toplam sayaç 0'ın altına inmez. */
function pointsAndDailyDeltaSQL(delta: number) {
  return {
    points: sql`${userProgress.points} + ${delta}`,
    dailyPointsEarned: sql`GREATEST(0, COALESCE(${userProgress.dailyPointsEarned}, 0) + ${delta})`,
  } as const;
}

/**
 * Doğru cevap çağrısının dönüş tipi. UI bu union'ı görerek:
 *   • `undefined` → eski davranış (geri uyumlu happy path).
 *   • `{ error: "hearts" }` → can yok, modal.
 *   • `{ error: "incorrect" }` → server doğrulamasında istemcinin "doğru"
 *     iddiası reddedildi (istemci ile server karar farkı). UI bu durumu
 *     `reduceHearts` akışına çevirir; "Bir hata oluştu" toast'undan çok
 *     daha açıklayıcı.
 */
export type UpsertChallengeProgressResult =
  | undefined
  | { error: "hearts" }
  | { error: "incorrect" };

export const upsertChallengeProgress = async (
  challengeId: number,
  userAnswer?: ChallengeAnswer,
): Promise<UpsertChallengeProgressResult> => {
  // Argument hardening: the action is reachable from the client with
  // arbitrary arguments; guard against non-integers before hitting the DB.
  if (
    typeof challengeId !== "number" ||
    !Number.isFinite(challengeId) ||
    !Number.isInteger(challengeId) ||
    challengeId <= 0
  ) {
    throw new Error("Geçersiz zorluk kimliği.");
  }

  // İstemci eski sürüm bile gönderiyor olsa payload şekli en azından
  // doğru olmalı. Tamamen yokluk eski client için izinli (geri uyumluluk);
  // bozulmuş bir şekil ise kasıt belirtisi → 400.
  if (userAnswer !== undefined && !isChallengeAnswerShape(userAnswer)) {
    throw new Error("Geçersiz cevap payload'u.");
  }

  const user = await getServerUser();
  if (!user) {
    throw new Error("Giriş yapmanız gerekiyor.");
  }
  const userId = user.id;

  // Shares the `points-add` bucket so a single user cannot spin up both
  // the lesson-completion action and the game-reward action in parallel
  // to bypass the per-second quota. Reward amount here is fixed
  // (SCORING_SYSTEM.LESSON_CHALLENGE_FIRST / _PRACTICE) so no cap is needed.
  const rl = await checkRateLimit({
    key: `points-add:user:${userId}`,
    ...RATE_LIMITS.pointsAdd,
  });
  if (!rl.allowed) {
    throw new PointsValidationError(
      "rate_limited",
      "Çok fazla istek. Lütfen biraz bekleyin.",
    );
  }

  const currentUserProgress = await getUserProgress();
  if (!currentUserProgress) {
    throw new Error("İlerleme bilgisi bulunamadı.");
  }

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
  if (!challenge) {
    throw new Error("Zorluk bulunamadı.");
  }
  const lessonId = challenge.lessonId;

  // Server-side cevap doğrulaması. `userAnswer` verilmişse istemcinin
  // "doğru cevapladım" iddiasını **gerçek** option verisiyle karşılaştırırız.
  // Yanlışsa: puan yazılmaz, satır oluşmaz, istemciye `{ error: "incorrect" }`
  // döner — quiz UI bunu can düşürme akışına çevirir. Bu, `MATCH_PAIRS`
  // her zaman-true ve `SEQUENCE` istemci-ref bypass açıklarını kapatır.
  //
  // `userAnswer === undefined` ise eski istemci açık sekmeye sahip — geçişte
  // kullanıcı kaybetmemek için trust ediyoruz, ama telemetri için logluyoruz.
  if (userAnswer !== undefined) {
    const optionsForChallenge = await db.query.challengeOptions.findMany({
      where: eq(challengeOptions.challengeId, challengeId),
    });
    const result = validateChallengeAnswer(
      { id: challenge.id, type: challenge.type },
      optionsForChallenge,
      userAnswer,
    );
    if (!result.ok) {
      // Şekil/tip uyumsuzluğu: istemci kasten/yanlışlıkla bozuk payload yolladı.
      log.warn("challenge answer rejected (malformed)", {
        userId,
        challengeId,
        challengeType: challenge.type,
        fields: { reason: result.reason },
      });
      return { error: "incorrect" };
    }
    if (!result.isCorrect) {
      // Gerçek cevapla istemci iddiası uyuşmuyor. Aritmetik bypass kapatıldı.
      log.info("challenge answer rejected (incorrect)", {
        userId,
        challengeId,
        challengeType: challenge.type,
      });
      return { error: "incorrect" };
    }
  } else {
    log.warn("upsertChallengeProgress called without userAnswer (legacy client)", {
      userId,
      challengeId,
      challengeType: challenge.type,
    });
  }

  const existingChallengeProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId)
    )
  });

  const isPractice = !!existingChallengeProgress;
  
  // Check if user has infinite hearts subscription
  const hasInfiniteHearts = await checkSubscriptionStatus(userId);
  
  // Only check hearts if user doesn't have infinite hearts and it's not practice
  if (!hasInfiniteHearts && currentUserProgress.hearts === 0 && !isPractice) {
    return { error: "hearts" };
  }

  // Resolve subject name for daily challenge tracking
  let subjectName: string | undefined;
  try {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      columns: { unitId: true },
    });
    if (lesson) {
      const unit = await db.query.units.findFirst({
        where: eq(units.id, lesson.unitId),
        columns: { courseId: true },
      });
      if (unit) {
        const course = await db.query.courses.findFirst({
          where: eq(courses.id, unit.courseId),
          columns: { title: true },
        });
        subjectName = course?.title;
      }
    }
  } catch { /* best-effort */ }

  if (isPractice) {
    const { total: practicePoints } = applyTimeBonus(SCORING_SYSTEM.LESSON_CHALLENGE_PRACTICE);

    // Atomic: both writes succeed together or roll back. Prevents drift
    // between `challenge_progress.correct_count` and `user_progress.points`
    // under timeouts / connection loss. `sql\`… + ${n}\`` replaces the
    // previous read-then-write, closing a lost-update race between
    // concurrent practice submissions.
    await db.transaction(async (tx) => {
      await tx
        .update(challengeProgress)
        .set({
          completed: true,
          correctCount: (existingChallengeProgress.correctCount ?? 0) + 1,
          lastAttemptedAt: new Date(),
        })
        .where(eq(challengeProgress.id, existingChallengeProgress.id));

      await tx
        .update(userProgress)
        .set(pointsAndDailyDeltaSQL(practicePoints))
        .where(eq(userProgress.userId, userId));
    });

    // Side-effects: intentionally outside the transaction. `updateDailyStreak`
    // and `updateChallengeProgress` write to independent tables; we do not
    // want a streak-tracker hiccup to invalidate a legitimate points award.
    await updateDailyStreak();
    await updateChallengeProgress(userId, "question_answered", { subject: subjectName });

    revalidatePath("/learn");
    revalidatePath(`/lesson/${lessonId}`);
    revalidatePath("/quests");
    return;
  }

  const { total: firstPoints } = applyTimeBonus(SCORING_SYSTEM.LESSON_CHALLENGE_FIRST);
  const schoolId = currentUserProgress.schoolId;

  // First-time completion: insert progress row, increment user points,
  // atomically increment school total. All three must commit together —
  // the previous code recomputed `schools.total_points` by summing every
  // user in the school (O(N) per award) which both burned DB time and
  // produced drift under concurrent writes. An atomic `totalPoints + delta`
  // is constant-time and lock-free in the common case.
  //
  // Race guard (0045): aynı (userId, challengeId) için iki paralel istek
  // gelirse `INSERT ... ON CONFLICT DO NOTHING` ile yalnızca biri kazanır
  // ve `RETURNING` boş gelirse ödülü vermeyiz. Aksi halde her iki çağrı da
  // `firstPoints`'i tüketebilirdi (UNIQUE constraint yokken eski hata).
  const now = new Date();
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(challengeProgress)
      .values({
        challengeId,
        userId,
        completed: true,
        correctCount: 1,
        incorrectCount: 0,
        lastAttemptedAt: now,
        firstCompletedAt: now,
      })
      .onConflictDoNothing({
        target: [challengeProgress.userId, challengeProgress.challengeId],
      })
      .returning({ id: challengeProgress.id });

    if (inserted.length === 0) {
      // Başka bir paralel istek satırı bizden önce attı — `firstPoints`'i
      // sessizce atla. Pratik puan yukarıdaki `existingCP?.completed` dalında
      // bir sonraki istekte zaten ödüllendirilir.
      return;
    }

    await tx
      .update(userProgress)
      .set({
        ...pointsAndDailyDeltaSQL(firstPoints),
        currentAnswerStreak: sql`COALESCE(${userProgress.currentAnswerStreak}, 0) + 1`,
        maxAnswerStreak: sql`GREATEST(COALESCE(${userProgress.maxAnswerStreak}, 0), COALESCE(${userProgress.currentAnswerStreak}, 0) + 1)`,
      })
      .where(eq(userProgress.userId, userId));

    if (schoolId) {
      await tx
        .update(schools)
        .set({ totalPoints: sql`${schools.totalPoints} + ${firstPoints}` })
        .where(eq(schools.id, schoolId));
    }
  });

  await updateDailyStreak();
  await updateChallengeProgress(userId, "question_answered", { subject: subjectName });

  revalidatePath("/learn");
  revalidatePath(`/lesson/${lessonId}`);
  revalidatePath("/quests");
  bustPointsCaches(userId, Boolean(schoolId));
};

export async function addPointsToUser(
  pointsToAdd: number,
  meta?: { gameType?: string },
) {
  // --- Input validation (never trust action arguments — DevTools can call this directly) ---
  if (
    typeof pointsToAdd !== "number" ||
    !Number.isFinite(pointsToAdd) ||
    !Number.isInteger(pointsToAdd) ||
    pointsToAdd <= 0
  ) {
    throw new PointsValidationError("invalid", "Geçersiz puan miktarı.");
  }

  const gameType = typeof meta?.gameType === "string" ? meta.gameType : undefined;
  const verdict = classifyPointsSubmission(pointsToAdd, gameType);

  if (verdict.kind === "reject") {
    // Beyond any plausible finished round → treat as tampering. `warn` (not
    // `error`) keeps this queryable for abuse review without polluting the
    // error_log error stream with an expected, handled rejection.
    log.warn("addPointsToUser rejected: abnormal score", {
      location: "addPointsToUser",
      source: "server-action",
      fields: { pointsToAdd, gameType, cap: verdict.cap },
    });
    throw new PointsValidationError(
      "over_cap",
      `Puan üst sınırı aşıldı (max: ${verdict.cap}).`,
    );
  }

  // Honest overshoot (e.g. exponential game scoring): award the cap instead
  // of rejecting so the player keeps their round. Recorded at info level for
  // balance telemetry — handy for tuning GAME_MAX_SCORE_PER_CALL.
  if (verdict.kind === "clamp") {
    log.info("addPointsToUser clamped to cap", {
      location: "addPointsToUser",
      fields: { claimed: verdict.claimed, awarded: verdict.points, gameType },
    });
  }

  const effectivePoints = verdict.points;

  const user = await getServerUser();
  if (!user) throw new Error("Giriş yapmanız gerekiyor.");
  const userId = user.id;

  // --- Per-user rate limit. Existing `RATE_LIMITS.pointsAdd` = 120/60s
  // (~2/s). Comfortable for real play; blocks scripted fan-out. We share
  // the same bucket key as `/api/user/points/add` so a user cannot double
  // their quota by alternating between the REST route and the action. ---
  const rl = await checkRateLimit({
    key: `points-add:user:${userId}`,
    ...RATE_LIMITS.pointsAdd,
  });
  if (!rl.allowed) {
    throw new PointsValidationError(
      "rate_limited",
      "Çok fazla puan isteği. Lütfen biraz bekleyin.",
    );
  }

  const currentUserProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { points: true, schoolId: true, previousTotalPoints: true, userId: true },
  });
  if (!currentUserProgress) throw new Error("İlerleme bilgisi bulunamadı.");

  const { total: adjustedPoints } = applyTimeBonus(effectivePoints);
  const schoolId = currentUserProgress.schoolId;

  // Atomic user+school increment. The previous implementation
  // recomputed `schools.total_points` from every user in the school on
  // every point award — O(N) per call and prone to write-skew under
  // concurrency. `totalPoints + delta` is constant-time, matches the
  // already-existing `addSchoolPoints` helper, and never drifts.
  let newTotal: number | undefined;
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(userProgress)
      .set(pointsAndDailyDeltaSQL(adjustedPoints))
      .where(eq(userProgress.userId, userId))
      .returning({ points: userProgress.points });
    newTotal = updated?.points;

    if (schoolId) {
      await tx
        .update(schools)
        .set({ totalPoints: sql`${schools.totalPoints} + ${adjustedPoints}` })
        .where(eq(schools.id, schoolId));
    }
  });

  // Side-effects: streak/challenge-progress tables and activity log. Kept
  // outside the tx so their failures cannot roll back a legitimate award.
  await updateDailyStreak();

  if (meta?.gameType) {
    await updateChallengeProgress(userId, "game_played", { gameType: meta.gameType });
    await updateChallengeProgress(userId, "game_points", { gameType: meta.gameType, points: adjustedPoints });
    logActivity({ userId, eventType: "game_end", page: `/games/${meta.gameType}`, metadata: { gameType: meta.gameType, points: adjustedPoints } });
  }

  // Oyun puanları: /learn + tüm ders ağaçlarını invalid etmek, App Router'ın
  // oyun ekranını (client state) aynı isimde RSCyle yenilemesine yol açıp
  // "bitiş ekranı" yerine liste/menüye fırlamaya neden olabiliyor.
  // Sadece görev/sıralama gibi tüketim sayfaları.
  if (meta?.gameType) {
    revalidatePath("/leaderboard");
    revalidatePath("/quests");
  } else {
    revalidatePath("/learn");
    revalidatePath("/lesson");
  }
  bustPointsCaches(userId, Boolean(schoolId));

  return { success: true, pointsAdded: adjustedPoints, newTotal: newTotal ?? null };
}

export const reduceHearts = async (challengeId: number) => {
  const user = await getServerUser();
  if (!user) throw new Error("Giriş yapmanız gerekiyor.");
  const userId = user.id;
  const currentUserProgress = await getUserProgress();
  if (!currentUserProgress) throw new Error("İlerleme bilgisi bulunamadı.");
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
  if (!challenge) throw new Error("Zorluk bulunamadı.");
  const lessonId = challenge.lessonId;
  const existingCP = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId)
    )
  });
  const isPractice = !!existingCP;
  if (isPractice) return { error: "practice" };

  // Check if user has infinite hearts subscription
  const hasInfiniteHearts = await checkSubscriptionStatus(userId);

  if (hasInfiniteHearts) {
    await db.insert(challengeProgress).values({
      challengeId,
      userId,
      completed: false,
      correctCount: 0,
      incorrectCount: 1,
      lastAttemptedAt: new Date(),
    });
    await db
      .update(userProgress)
      .set({ currentAnswerStreak: 0 })
      .where(eq(userProgress.userId, userId));
    revalidatePath("/quests");
    return;
  }

  if (currentUserProgress.hearts === 0) return { error: "hearts" };

  // Atomic heart decrement + point penalty + progress write. `hearts - 1`
  // and `points + penalty` use SQL arithmetic so two concurrent "wrong
  // answer" submissions cannot both read `hearts = 3` and both write 2.
  const now = new Date();
  const startRegenTimer = !currentUserProgress.lastHeartRegenAt;

  const penalty = SCORING_SYSTEM.LESSON_CHALLENGE_PENALTY;
  await db.transaction(async (tx) => {
    // `penalty` negatiftir (yanlış cevap cezası). `GREATEST(.., 0)` ile
    // toplam puanı sıfırın altına düşürmeyiz: aksi halde yeni / az puanlı
    // bir kullanıcının skoru görsel olarak negatif görünür ve lider tablosu
    // / okul agregatları için tutarsızlık yaratırdı.
    const setClause: Record<string, unknown> = {
      hearts: sql`GREATEST(${userProgress.hearts} - 1, 0)`,
      points: sql`GREATEST(0, ${userProgress.points} + ${penalty})`,
      dailyPointsEarned: sql`GREATEST(0, COALESCE(${userProgress.dailyPointsEarned}, 0) + ${penalty})`,
      currentAnswerStreak: 0,
    };
    if (startRegenTimer) setClause.lastHeartRegenAt = now;

    await tx.update(userProgress).set(setClause).where(eq(userProgress.userId, userId));

    // Upsert the failed attempt. `existingCP` was loaded above; inside
    // the transaction we still need a fresh look to avoid a race where
    // two concurrent calls both insert (violating the unique index).
    const existingProgress = await tx.query.challengeProgress.findFirst({
      where: and(
        eq(challengeProgress.userId, userId),
        eq(challengeProgress.challengeId, challengeId),
      ),
    });

    if (existingProgress) {
      await tx
        .update(challengeProgress)
        .set({
          incorrectCount: sql`${challengeProgress.incorrectCount} + 1`,
          lastAttemptedAt: now,
        })
        .where(eq(challengeProgress.id, existingProgress.id));
    } else {
      await tx.insert(challengeProgress).values({
        challengeId,
        userId,
        completed: false,
        correctCount: 0,
        incorrectCount: 1,
        lastAttemptedAt: now,
      });
    }
  });

  revalidatePath("/learn");
  revalidatePath(`/lesson/${lessonId}`);
  revalidatePath("/quests");
};

/**
 * Ders tamamlandığında verilen bonusu hesaplar ve **bir kez** yazar.
 *
 * Güvenlik:
 *   • `lessonId` istemciden gelir, ama bonus yalnızca **gerçekten** o derste
 *     hem en az bir challenge tamamlanmış (`firstCompletedAt IS NOT NULL`)
 *     hem de **tüm challenge'lar** tamamlanmışsa verilir.
 *   • `wrongCount` istemciden alınmaz; `challenge_progress.incorrectCount`
 *     toplamı üzerinden sunucuda hesaplanır.
 *   • Idempotency: `lesson_completion_bonuses (user_id, lesson_id)` UNIQUE +
 *     `INSERT … ON CONFLICT DO NOTHING RETURNING`. Aynı kullanıcı aynı dersi
 *     ikinci kez bitirse de bonus tekrar verilmez. UI yine **kayıttaki**
 *     değeri okur — geriye dönük tutarlılık.
 *   • `pointsAdd` kovasıyla rate limit (`addPointsToUser` ile aynı kova
 *     anahtarı): saniyede dolaşıma sokulabilecek toplam puan kotası tek
 *     kova üzerinden yönetilir.
 *
 * Dönüş: UI'da gösterilen ödül kırılımı. Idempotent re-call durumunda
 * `alreadyClaimed: true` ile birlikte **kayıttaki** bonus döner; mevcut
 * UI tarafı bu durumda yine doğru toplamı görür ama puan tekrar artmaz.
 */
export async function awardLessonCompletionBonus(lessonId: number) {
  if (
    typeof lessonId !== "number" ||
    !Number.isFinite(lessonId) ||
    !Number.isInteger(lessonId) ||
    lessonId <= 0
  ) {
    return { completionBonus: 0, perfectBonus: 0, alreadyClaimed: false };
  }

  const user = await getServerUser();
  if (!user) return { completionBonus: 0, perfectBonus: 0, alreadyClaimed: false };
  const userId = user.id;

  const rl = await checkRateLimit({
    key: `points-add:user:${userId}`,
    ...RATE_LIMITS.pointsAdd,
  });
  if (!rl.allowed) {
    return { completionBonus: 0, perfectBonus: 0, alreadyClaimed: false };
  }

  // Idempotency: bonus daha önce verilmişse aynı değerleri döndür.
  const prior = await db.query.lessonCompletionBonuses.findFirst({
    where: and(
      eq(lessonCompletionBonuses.userId, userId),
      eq(lessonCompletionBonuses.lessonId, lessonId),
    ),
    columns: { completionBonus: true, perfectBonus: true },
  });
  if (prior) {
    return {
      completionBonus: prior.completionBonus,
      perfectBonus: prior.perfectBonus,
      alreadyClaimed: true,
    };
  }

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    columns: { id: true },
    with: {
      challenges: { columns: { id: true } },
    },
  });
  if (!lesson || lesson.challenges.length === 0) {
    return { completionBonus: 0, perfectBonus: 0, alreadyClaimed: false };
  }

  const challengeIds = lesson.challenges.map((c) => c.id);
  const expectedCount = challengeIds.length;

  // Server-side gerçek istatistik: tamamlanma sayısı + yanlış toplamı.
  const [stats] = await db
    .select({
      completedCount: sql<number>`COUNT(*) FILTER (WHERE ${challengeProgress.completed} = true)::int`,
      wrongTotal: sql<number>`COALESCE(SUM(${challengeProgress.incorrectCount}), 0)::int`,
    })
    .from(challengeProgress)
    .where(
      and(
        eq(challengeProgress.userId, userId),
        sql`${challengeProgress.challengeId} = ANY(${challengeIds})`,
      ),
    );

  const completedCount = Number(stats?.completedCount ?? 0);
  if (completedCount < expectedCount) {
    // Henüz bitmemiş. Sahte istek veya yarış: bonus yok, kayıt da yok.
    return { completionBonus: 0, perfectBonus: 0, alreadyClaimed: false };
  }

  const serverWrongCount = Number(stats?.wrongTotal ?? 0);
  const completionBonus = SCORING_SYSTEM.LESSON_COMPLETION_BONUS;
  const perfectBonus = serverWrongCount === 0 ? SCORING_SYSTEM.PERFECT_LESSON_BONUS : 0;
  const baseTotal = completionBonus + perfectBonus;
  const { total: totalBonus } = applyTimeBonus(baseTotal);

  if (totalBonus <= 0) {
    return { completionBonus, perfectBonus, alreadyClaimed: false };
  }

  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { schoolId: true },
  });
  const schoolId = progress?.schoolId ?? null;

  // Atomik blok:
  //   1. Idempotent kayıt: INSERT ... ON CONFLICT DO NOTHING RETURNING.
  //      0 satır dönerse bu request bonus vermez.
  //   2. Yalnızca yeni kayıt oluşunca user_progress + schools güncellenir.
  let inserted = false;
  await db.transaction(async (tx) => {
    const ins = await tx
      .insert(lessonCompletionBonuses)
      .values({
        userId,
        lessonId,
        wrongCount: serverWrongCount,
        completionBonus,
        perfectBonus,
        totalAwarded: totalBonus,
      })
      .onConflictDoNothing({
        target: [lessonCompletionBonuses.userId, lessonCompletionBonuses.lessonId],
      })
      .returning({ id: lessonCompletionBonuses.id });

    if (ins.length === 0) return;
    inserted = true;

    await tx
      .update(userProgress)
      .set(pointsAndDailyDeltaSQL(totalBonus))
      .where(eq(userProgress.userId, userId));

    if (schoolId) {
      await tx
        .update(schools)
        .set({ totalPoints: sql`${schools.totalPoints} + ${totalBonus}` })
        .where(eq(schools.id, schoolId));
    }
  });

  if (!inserted) {
    return { completionBonus, perfectBonus, alreadyClaimed: true };
  }

  await updateDailyStreak();
  if (serverWrongCount === 0) {
    await updateChallengeProgress(userId, "lesson_completed_perfect", {
      wrongCount: serverWrongCount,
    });
  }
  logActivity({
    userId,
    eventType: "lesson_complete",
    metadata: { lessonId, wrongCount: serverWrongCount, bonus: totalBonus },
  });
  revalidatePath("/learn");
  bustPointsCaches(userId, Boolean(schoolId));

  return { completionBonus, perfectBonus, alreadyClaimed: false };
}
