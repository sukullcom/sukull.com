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

export const updateTotalPointsForSchools = async () => {
  const log = await getRequestLogger({ labels: { action: 'updateTotalPointsForSchools' } });
  try {
    log.info('school points full-recompute started');

    // Use a more efficient approach with a single UPDATE query using a CTE
    await db.execute(sql`
      WITH school_points AS (
        SELECT 
          school_id,
          SUM(points::int) as total_points
        FROM user_progress 
        WHERE school_id IS NOT NULL
        GROUP BY school_id
      )
      UPDATE schools 
      SET total_points = COALESCE(sp.total_points, 0)
      FROM school_points sp
      WHERE schools.id = sp.school_id;
    `);
    
    // Also reset schools with no users to 0 points
    await db.execute(sql`
      UPDATE schools 
      SET total_points = 0 
      WHERE id NOT IN (
        SELECT DISTINCT school_id 
        FROM user_progress 
        WHERE school_id IS NOT NULL
      );
    `);

    log.info('school points full-recompute completed');
    return true;
  } catch (error) {
    log.error({
      message: 'school points full-recompute failed',
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
