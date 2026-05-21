// actions/user-progress.ts
'use server';

import { POINTS_TO_REFILL, SCORING_SYSTEM } from '@/constants';
import db from '@/db/drizzle';
import { getCourseById, getUserProgress } from '@/db/queries';
import { schools, userProgress, users } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { canChangeSchoolSelection, nextLockExpiresAt } from '@/lib/school-grade-lock';
import { logActivity } from '@/lib/activity-logger';
import { getRequestLogger, logger } from '@/lib/logger';
import {
  LEADERBOARD_ACTIVE_WINDOW_DAYS,
  LEADERBOARD_MIN_ACTIVE_STUDENTS,
  LEADERBOARD_PRIOR_STRENGTH,
} from '@/lib/leaderboard-constants';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { revalidateTag } from 'next/cache';

/**
 * Okul leaderboard skorlarını tam yeniden hesaplar.
 *
 * Eski sürüm sadece `total_points = SUM(user_progress.points)` yapıyordu;
 * bu, **okul büyüklüğüne korelasyonlu** bir liderlik üretiyordu (10K
 * öğrencili okul, 200 öğrencili dürüst okulu sayısal üstünlükle eziyordu).
 *
 * Yeni sürüm üç metriği aynı CTE-zincirinde hesaplar:
 *
 *   1. active_student_count  — son `LEADERBOARD_ACTIVE_WINDOW_DAYS` günde
 *                              `activity_log`'da `lesson_complete` /
 *                              `game_end` üreten öğrenci sayısı.
 *   2. raw_avg_points        — aktif öğrencilerin ham puan ortalaması.
 *   3. top_avg_score         — Bayesian shrinkage ile düzeltilmiş skor:
 *
 *        bayes = (raw_avg × n + prior_mean × k) / (n + k)
 *
 *      Burada n = active_count, k = LEADERBOARD_PRIOR_STRENGTH,
 *      prior_mean = aynı okul tipindeki, eşiği geçen okulların raw_avg
 *      değerlerinin medyanı (outlier'a dayanıklı).
 *
 * Tek UPDATE ifadesi — Postgres CTE'leri set bazında çalıştırır; 10K
 * okul × 100K kullanıcı için saniyeler mertebesinde tamamlanır. İndeks
 * `idx_schools_leaderboard_score` (partial, active_count >= 10) liste
 * sorgularını ucuz tutar.
 *
 * `total_points` da güncellenir (görüntü için), ama sıralamayı artık
 * `top_avg_score` belirler.
 */
export const updateTotalPointsForSchools = async () => {
  const log = await getRequestLogger({ labels: { action: 'updateTotalPointsForSchools' } });
  try {
    log.info('school leaderboard recompute started');

    const windowDays = LEADERBOARD_ACTIVE_WINDOW_DAYS;
    const priorStrength = LEADERBOARD_PRIOR_STRENGTH;
    const minActive = LEADERBOARD_MIN_ACTIVE_STUDENTS;

    await db.execute(sql`
      WITH
        -- 1) Son ${sql.raw(String(windowDays))} günde puan üreten öğrenciler.
        --    activity_log'da lesson_complete / game_end olayı varsa aktif.
        active_users AS (
          SELECT DISTINCT al.user_id
          FROM activity_log al
          WHERE al.created_at >= NOW() - ${sql.raw(`INTERVAL '${windowDays} days'`)}
            AND al.event_type IN ('lesson_complete', 'game_end')
        ),
        -- 2) Okul başına tüm öğrencilerin toplam puanı (görüntü için
        --    total_points). Incremental update'lerle (ders sonu vs.)
        --    semantik tutarlı kalsın.
        school_total AS (
          SELECT
            up.school_id,
            COALESCE(SUM(up.points)::int, 0) AS total_points
          FROM user_progress up
          WHERE up.school_id IS NOT NULL
          GROUP BY up.school_id
        ),
        -- 3) Sadece aktif öğrenciler — sıralama metrikleri buradan üretilir.
        school_active AS (
          SELECT
            up.school_id,
            up.user_id,
            up.points
          FROM user_progress up
          INNER JOIN active_users au ON au.user_id = up.user_id
          WHERE up.school_id IS NOT NULL
        ),
        -- 4) Aktiviteye göre okul aggregate'i.
        school_agg AS (
          SELECT
            s.id   AS school_id,
            s.type AS school_type,
            COALESCE(st.total_points, 0)                  AS total_points,
            COUNT(sa.user_id)::int                         AS active_count,
            COALESCE(AVG(sa.points)::numeric(12,2), 0)     AS raw_avg
          FROM schools s
          LEFT JOIN school_total  st ON st.school_id = s.id
          LEFT JOIN school_active sa ON sa.school_id = s.id
          GROUP BY s.id, s.type, st.total_points
        ),
        -- 5) Okul tipi bazında prior_mean = medyan(raw_avg) — eşiği geçenler.
        --    Eşiği geçen okul yoksa o tip için prior NULL kalır → smoothing
        --    yapılmaz, raw_avg doğrudan kullanılır.
        type_prior AS (
          SELECT
            school_type,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY raw_avg) AS prior_mean
          FROM school_agg
          WHERE active_count >= ${sql.raw(String(minActive))}
          GROUP BY school_type
        ),
        -- 6) Bayesian shrinkage uygulanmış skor.
        school_score AS (
          SELECT
            sa.school_id,
            sa.total_points,
            sa.active_count,
            sa.raw_avg,
            CASE
              WHEN sa.active_count = 0 THEN 0
              WHEN tp.prior_mean IS NULL THEN sa.raw_avg
              ELSE (
                sa.raw_avg * sa.active_count
                + tp.prior_mean * ${sql.raw(String(priorStrength))}
              ) / (sa.active_count + ${sql.raw(String(priorStrength))})
            END::numeric(12,2) AS bayes_score
          FROM school_agg sa
          LEFT JOIN type_prior tp ON tp.school_type = sa.school_type
        )
      UPDATE schools s
      SET
        total_points         = ss.total_points,
        active_student_count = ss.active_count,
        raw_avg_points       = ss.raw_avg,
        top_avg_score        = ss.bayes_score
      FROM school_score ss
      WHERE s.id = ss.school_id;
    `);

    // unstable_cache verileri eskimesin diye tag'i tetikle. Cron günde
    // bir koşar; bu tek bir invalidate yeterli.
    try {
      revalidateTag(CACHE_TAGS.schoolLeaderboard);
    } catch {
      // revalidateTag çağrısı bazen non-request context'te no-op atar;
      // güvenli şekilde yutuyoruz, sıralama sonraki TTL bitiminde tazelenir.
    }

    log.info('school leaderboard recompute completed');
    return true;
  } catch (error) {
    log.error({
      message: 'school leaderboard recompute failed',
      error,
      source: 'server-action',
      location: 'user-progress/updateTotalPointsForSchools',
    });
    return false;
  }
};

/**
 * Okul değişimi — 6 ay kilidi + okul puan özetleri.
 * İlk atama (önceden null) serbesttir.
 */
export async function applySchoolChangeWithLock(
  userId: string,
  nextSchoolId: number | null,
): Promise<void> {
  const row = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });
  if (!row?.onboardingCompletedAt) {
    throw new Error('Önce öğrenme yolunuzu tamamlayın.');
  }
  const now = new Date();
  const decision = canChangeSchoolSelection(
    now,
    row.schoolChangeLockedUntil ?? null,
    row.schoolId,
    nextSchoolId,
    {
      onboardingCompletedAt: row.onboardingCompletedAt ?? null,
      totalPoints: row.points ?? 0,
    },
  );
  if (!decision.allowed) {
    throw new Error(
      `Okul değişikliği için ${decision.nextAllowedAt.toLocaleDateString('tr-TR')} tarihine kadar beklemelisiniz.`,
    );
  }
  if ((row.schoolId ?? null) === (nextSchoolId ?? null)) {
    return;
  }

  const oldSchoolId = row.schoolId;
  // Muafiyet kullanıldıysa kilidi yeniden başlatma (deneme veya düşük puan
  // muafiyeti boyunca kullanıcı denemeye devam edebilsin).
  const startNewLock = decision.exemption == null;

  await db
    .update(userProgress)
    .set({
      schoolId: nextSchoolId,
      ...(startNewLock ? { schoolChangeLockedUntil: nextLockExpiresAt(now) } : {}),
    })
    .where(eq(userProgress.userId, userId));

  if (nextSchoolId) {
    await updateSchoolPoints(nextSchoolId);
  }
  if (oldSchoolId) {
    await updateSchoolPoints(oldSchoolId);
  }
}

export const upsertUserSchool = async (schoolId: number) => {
  const user = await getServerUser();
  if (!user) throw new Error('Giriş yapmanız gerekiyor.');
  const existingUserProgress = await getUserProgress();

  if (!existingUserProgress) {
    redirect('/onboarding');
  }
  if (!existingUserProgress.onboardingCompletedAt) {
    redirect('/onboarding');
  }

  await applySchoolChangeWithLock(user.id, schoolId);
};

// Helper function to update a single school's points
async function updateSchoolPoints(schoolId: number) {
  try {
    if (!schoolId) return;
    
    // Calculate total points for just this school in one query
    const [result] = await db.select({
      totalPoints: sql<number>`sum(${userProgress.points} :: int)`,
    })
    .from(userProgress)
    .where(eq(userProgress.schoolId, schoolId));
    
    // Update the school with calculated points
    await db.update(schools)
      .set({ totalPoints: result.totalPoints || 0 })
      .where(eq(schools.id, schoolId));
      
    return true;
  } catch (error) {
    logger.error({
      message: 'single-school points update failed',
      error,
      source: 'server-action',
      location: 'user-progress/updateSchoolPoints',
      fields: { schoolId },
    });
    return false;
  }
}

export const upsertUserProgress = async (courseId: number) => {
  const user = await getServerUser();
  if (!user) throw new Error('Giriş yapmanız gerekiyor.');
  const userId = user.id;
  const course = await getCourseById(courseId);
  if (!course) throw new Error('Ders bulunamadı.');
  if (!course.units.length || !course.units[0].lessons.length) {
    throw new Error('Bu ders henüz içerik barındırmıyor.');
  }
  const profile = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true },
  });
  const providedName = profile?.name || user.user_metadata?.full_name || 'User';
  const existing = await getUserProgress();
  if (!existing) {
    redirect('/onboarding');
  }
  if (!existing.onboardingCompletedAt) {
    redirect('/onboarding');
  }

  const userImageSrc = existing.userImageSrc || '/mascot_purple.svg';

  await db
    .update(userProgress)
    .set({ activeCourseId: courseId, userName: providedName, userImageSrc })
    .where(eq(userProgress.userId, userId));
  revalidatePath('/courses');
  revalidatePath('/learn');
  redirect('/learn');
};

/**
 * Canları doldur — atomik. Önceki sürüm `findFirst` ile puan okuyor sonra JS
 * aritmetiği ile yazıyordu; iki paralel istek aynı bakiyeyi görebiliyor ve
 * kullanıcı 100 puan ödeyip 2 refill alabiliyordu. Yeni sürümde tek bir
 * `UPDATE … WHERE points >= cost AND hearts < 5 RETURNING` — koşul
 * sağlanmazsa 0 satır döner, çift harcama yok.
 */
export const refillHearts = async () => {
  const user = await getServerUser();
  if (!user) throw new Error('Giriş yapmanız gerekiyor.');
  const userId = user.id;

  const cost = POINTS_TO_REFILL;
  const updated = await db
    .update(userProgress)
    .set({
      hearts: 5,
      points: sql`${userProgress.points} - ${cost}`,
      previousTotalPoints: sql`COALESCE(${userProgress.previousTotalPoints}, 0) - ${cost}`,
      lastHeartRegenAt: new Date(),
    })
    .where(
      and(
        eq(userProgress.userId, userId),
        sql`${userProgress.points} >= ${cost}`,
        sql`${userProgress.hearts} < 5`,
      ),
    )
    .returning({ points: userProgress.points, hearts: userProgress.hearts });

  if (updated.length === 0) {
    // Hangi koşulun düştüğünü ayrıştırmak için tek bir oku — hata mesajı UX.
    const cur = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: { hearts: true, points: true },
    });
    if (!cur) throw new Error('İlerleme bilgisi bulunamadı.');
    if (cur.hearts >= 5) throw new Error('Canların zaten tam dolu.');
    if (cur.points < cost) throw new Error('Yeterli puanınız yok.');
    throw new Error('Canlar şu an doldurulamadı. Lütfen tekrar deneyin.');
  }

  logActivity({ userId, eventType: "shop_purchase", page: "/shop", metadata: { item: "hearts_refill", cost } });

  revalidatePath('/shop');
  revalidatePath('/learn');
};

/**
 * Updates a school's total points when a user earns points
 * This should be called after updating the user's points
 */
export async function addSchoolPoints(schoolId: number, points: number) {
  try {
    if (points <= 0 || !schoolId) return false;
    
    // Update the school points directly with a SQL increment
    // This avoids the need to query the current points first
    const result = await db.update(schools)
      .set({
        totalPoints: sql`${schools.totalPoints} + ${points}`
      })
      .where(eq(schools.id, schoolId))
      .returning({ updated: schools.id });
    
    return result.length > 0;
  } catch (error) {
    logger.error({
      message: 'addSchoolPoints failed',
      error,
      source: 'server-action',
      location: 'user-progress/addSchoolPoints',
      fields: { schoolId, points },
    });
    return false;
  }
}

/**
 * Resets the daily streak for all users.
 * Delegates to performDailyReset in daily-streak.ts.
 */
export async function resetDailyStreaks() {
  try {
    const { performDailyReset } = await import("./daily-streak");
    return await performDailyReset();
  } catch (error) {
    logger.error({
      message: 'resetDailyStreaks wrapper failed',
      error,
      source: 'server-action',
      location: 'user-progress/resetDailyStreaks',
    });
    return false;
  }
}

/**
 * Streak freeze satın al — atomik. Aynı çift-harcama riski (TOCTOU) `refillHearts`
 * ile aynı modelde kapatılır: tek bir `UPDATE … WHERE points >= cost RETURNING`.
 */
export async function purchaseStreakFreeze() {
  const user = await getServerUser();
  if (!user) return { error: "Giriş yapmanız gerekiyor." };
  const userId = user.id;

  const cost = SCORING_SYSTEM.STREAK_FREEZE_COST;
  const updated = await db
    .update(userProgress)
    .set({
      points: sql`${userProgress.points} - ${cost}`,
      previousTotalPoints: sql`COALESCE(${userProgress.previousTotalPoints}, 0) - ${cost}`,
      streakFreezeCount: sql`COALESCE(${userProgress.streakFreezeCount}, 0) + 1`,
    })
    .where(
      and(
        eq(userProgress.userId, userId),
        sql`${userProgress.points} >= ${cost}`,
      ),
    )
    .returning({ id: userProgress.userId });

  if (updated.length === 0) {
    const cur = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: { points: true },
    });
    if (!cur) return { error: "Kullanıcı bulunamadı" };
    if (cur.points < cost) return { error: "Yeterli puanın yok" };
    return { error: "Satın alma şu an tamamlanamadı. Lütfen tekrar deneyin." };
  }

  logActivity({ userId, eventType: "shop_purchase", page: "/shop", metadata: { item: "streak_freeze", cost } });

  revalidatePath('/shop');
  revalidatePath('/learn');
  return { success: true };
}
