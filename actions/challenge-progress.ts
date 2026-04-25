"use server";

import db from "@/db/drizzle";
import { getUserProgress, checkSubscriptionStatus } from "@/db/queries";
import { challengeProgress, challenges, courses, lessons, units, schools, userProgress } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerUser } from "@/lib/auth";
import { updateDailyStreak } from "./daily-streak";
import { SCORING_SYSTEM } from "@/constants";
import { applyTimeBonus } from "@/lib/time-bonus";
import { updateChallengeProgress } from "./daily-challenges";
import { logActivity } from "@/lib/activity-logger";
import { resolvePointsCap } from "@/lib/api-limits";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit-db";
import { logger } from "@/lib/logger";

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

export const upsertChallengeProgress = async (challengeId: number) => {
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
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(challengeProgress).values({
      challengeId,
      userId,
      completed: true,
      correctCount: 1,
      incorrectCount: 0,
      lastAttemptedAt: now,
      firstCompletedAt: now,
    });

    await tx
      .update(userProgress)
      .set(pointsAndDailyDeltaSQL(firstPoints))
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
  const cap = resolvePointsCap(gameType);
  if (pointsToAdd > cap) {
    // Log to error_log so we can investigate whether it's an honest bug or abuse.
    log.error({
      message: "addPointsToUser rejected: over cap",
      location: "addPointsToUser",
      source: "server-action",
      fields: { pointsToAdd, gameType, cap },
    });
    throw new PointsValidationError(
      "over_cap",
      `Puan üst sınırı aşıldı (max: ${cap}).`,
    );
  }

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

  const { total: adjustedPoints } = applyTimeBonus(pointsToAdd);
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

  revalidatePath("/learn");
  revalidatePath("/lesson");

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
    const setClause: Record<string, unknown> = {
      hearts: sql`GREATEST(${userProgress.hearts} - 1, 0)`,
      points: sql`${userProgress.points} + ${penalty}`,
      dailyPointsEarned: sql`GREATEST(0, COALESCE(${userProgress.dailyPointsEarned}, 0) + ${penalty})`,
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
};

/**
 * Awards bonus points when a lesson is fully completed.
 * Returns the bonuses that were awarded so the client can display them.
 */
export async function awardLessonCompletionBonus(
  lessonId: number,
  wrongCount: number
) {
  const user = await getServerUser();
  if (!user) return { completionBonus: 0, perfectBonus: 0 };
  const userId = user.id;

  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { points: true, schoolId: true },
  });
  if (!progress) return { completionBonus: 0, perfectBonus: 0 };

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    columns: { id: true },
    with: {
      challenges: { columns: { id: true } },
    },
  });
  if (!lesson || lesson.challenges.length === 0)
    return { completionBonus: 0, perfectBonus: 0 };

  const completionBonus = SCORING_SYSTEM.LESSON_COMPLETION_BONUS;
  const perfectBonus = wrongCount === 0 ? SCORING_SYSTEM.PERFECT_LESSON_BONUS : 0;
  const baseTotal = completionBonus + perfectBonus;
  const { total: totalBonus } = applyTimeBonus(baseTotal);

  if (totalBonus > 0) {
    const schoolId = progress.schoolId;
    // Atomic user + school increment. Previous implementation was a
    // read-then-write on `userProgress.points` with no school update at
    // all, so the global leaderboard drifted after every perfect lesson.
    await db.transaction(async (tx) => {
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

    await updateDailyStreak();
    await updateChallengeProgress(userId, "lesson_completed_perfect", { wrongCount });
    logActivity({ userId, eventType: "lesson_complete", metadata: { lessonId, wrongCount, bonus: totalBonus } });
    revalidatePath("/learn");
  }

  return { completionBonus, perfectBonus };
}
