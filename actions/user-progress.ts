// actions/user-progress.ts
'use server';

import { POINTS_TO_REFILL } from '@/constants';
import db from '@/db/drizzle';
import { getCourseById, getUserProgress, checkSubscriptionStatus } from '@/db/queries';
import { challengeProgress, challenges, schools, userProgress, userDailyStreak } from '@/db/schema';
import { and, eq, gt, sql, isNotNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { users } from '@/utils/users';
import { updateDailyStreak } from "./daily-streak";
import { normalizeAvatarUrl } from '@/utils/avatar';

export const updateTotalPointsForSchools = async () => {
  try {
    console.log('Starting optimized school points update...');
    
    // Use a more efficient approach with a single UPDATE query using a CTE
    const result = await db.execute(sql`
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
    
    console.log('School points update completed successfully');
    return true;
  } catch (error) {
    console.error("Error updating school totals:", error);
    return false;
  }
};

export const upsertUserSchool = async (schoolId: number) => {
  const user = await getServerUser();
  if (!user) throw new Error('Unauthorized');
  const userId = user.id;
  const existingUserProgress = await getUserProgress();
  
  if (existingUserProgress) {
    const oldSchoolId = existingUserProgress.schoolId;
    
    // Update the user's school
    await db.update(userProgress)
      .set({ schoolId })
      .where(eq(userProgress.userId, userId));
    
    // If user is changing schools, update points for both old and new schools
    if (oldSchoolId !== schoolId) {
      // Update points for the new school
      await updateSchoolPoints(schoolId);
      
      // If there was a previous school, update its points too
      if (oldSchoolId) {
        await updateSchoolPoints(oldSchoolId);
      }
    }
  } else {
    // Create new user progress
    const profile = await users.getUser(userId).catch(() => null);
    const userName = profile?.name || user.user_metadata?.full_name || 'User';
    // Always use default mascot avatar
    const userImageSrc = '/mascot_purple.svg';
    
    await db.insert(userProgress)
      .values({ userId, schoolId, userName, userImageSrc });
    
    // Update only the affected school
    await updateSchoolPoints(schoolId);
  }
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
    console.error(`Error updating points for school ${schoolId}:`, error);
    return false;
  }
}

export const upsertUserProgress = async (courseId: number) => {
  const user = await getServerUser();
  if (!user) throw new Error('Unauthorized');
  const userId = user.id;
  const course = await getCourseById(courseId);
  if (!course) throw new Error('Course not found');
  if (!course.units.length || !course.units[0].lessons.length) {
    throw new Error('Course is empty');
  }
  const profile = await users.getUser(userId).catch(() => null);
  const providedName = profile?.name || user.user_metadata?.full_name || 'User';
  const existing = await getUserProgress();
  // Use existing avatar if available, otherwise use default mascot (never from OAuth provider)
  const userImageSrc = existing?.userImageSrc || '/mascot_purple.svg';

  if (existing) {
    await db
      .update(userProgress)
      .set({ activeCourseId: courseId, userName: providedName, userImageSrc })
      .where(eq(userProgress.userId, userId));
    revalidatePath('/courses');
    revalidatePath('/learn');
    redirect('/learn');
  } else {
    await db.insert(userProgress).values({ userId, activeCourseId: courseId, userName: providedName, userImageSrc });
    revalidatePath('/courses');
    revalidatePath('/learn');
    redirect('/learn');
  }
};

export const reduceHearts = async (challengeId: number) => {
  const user = await getServerUser();
  if (!user) throw new Error('Unauthorized');
  const userId = user.id;
  const currentUserProgress = await getUserProgress();
  if (!currentUserProgress) throw new Error('User progress not found');
  const challenge = await db.query.challenges.findFirst({ where: eq(challenges.id, challengeId) });
  if (!challenge) throw new Error('Challenge not found');
  const lessonId = challenge.lessonId;
  const existingCP = await db.query.challengeProgress.findFirst({
    where: and(eq(challengeProgress.userId, userId), eq(challengeProgress.challengeId, challengeId)),
  });
  const isPractice = !!existingCP;
  if (isPractice) return { error: 'practice' };
  
  // Check if user has infinite hearts subscription
  const hasInfiniteHearts = await checkSubscriptionStatus(userId);
  
  // If user has infinite hearts, don't reduce hearts or points
  if (hasInfiniteHearts) {
    return; // No error, just continue without reducing hearts
  }
  
  if (currentUserProgress.hearts === 0) return { error: 'hearts' };

  await db
    .update(userProgress)
    .set({
      hearts: Math.max(currentUserProgress.hearts - 1, 0),
      points: currentUserProgress.points - 2,
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath('/shop');
  revalidatePath('/learn');
  revalidatePath('/leaderboard');
  revalidatePath(`/lesson/${lessonId}`);
};

export const refillHearts = async () => {
  const currentUserProgress = await getUserProgress();
  if (!currentUserProgress) throw new Error('User progress not found');
  if (currentUserProgress.hearts === 5) throw new Error('Hearts are already full');
  if (currentUserProgress.points < POINTS_TO_REFILL) throw new Error('Not enough points');

  await db
    .update(userProgress)
    .set({
      hearts: 5,
      points: currentUserProgress.points - POINTS_TO_REFILL,
    })
    .where(eq(userProgress.userId, currentUserProgress.userId));

  revalidatePath('/shop');
  revalidatePath('/learn');
  revalidatePath('/leaderboard');
};

/**
 * Updates the user's points and checks streak
 * This should be called when the user earns points from various activities
 */
export async function addUserPoints(points: number) {
  try {
    if (points <= 0) return null;
    
    const user = await getServerUser();
    if (!user) return null;
    
    const userId = user.id;
    
    // FIRST: Check if daily reset is needed (automatic new day detection)
    const { checkAndPerformDailyResetIfNeeded, checkStreakContinuity } = await import("./daily-streak");
    await checkAndPerformDailyResetIfNeeded();
    
    // Check streak continuity
    await checkStreakContinuity(userId);
    
    // Get current user progress
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    if (!progress) return null;
    
    // Initialize streak tracking if needed
    if (progress.previousTotalPoints === null || progress.previousTotalPoints === undefined) {
      await db.update(userProgress)
        .set({
          previousTotalPoints: progress.points,
          lastStreakCheck: new Date(),
        })
        .where(eq(userProgress.userId, userId));
    }
    
    // Update points
    const newPoints = progress.points + points;
    
    await db.update(userProgress)
      .set({
        points: newPoints,
      })
      .where(eq(userProgress.userId, userId));
    
    // Check if this update qualifies for a streak update
    // and update the streak if needed
    await updateDailyStreak();
    
    // Get updated progress
    const updatedProgress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    return updatedProgress;
  } catch (error) {
    console.error("Error adding user points:", error);
    return null;
  }
}

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
    console.error("Error adding school points:", error);
    return false;
  }
}

/**
 * Resets the daily streak for all users
 * This should be run once per day at midnight via a scheduled job
 * DEPRECATED: Use checkAndResetStreaks from daily-streak.ts instead
 */
export async function resetDailyStreaks() {
  try {
    // Import the new function to avoid duplication
    const { checkAndResetStreaks } = await import("./daily-streak");
    return await checkAndResetStreaks();
  } catch (error) {
    console.error("Error resetting daily streaks:", error);
    return false;
  }
}

export const reduceHeartsForSubScribe = async () => {
  const user = await getServerUser();
  if (!user) throw new Error('Unauthorized');
  
  const currentUserProgress = await getUserProgress();
  if (!currentUserProgress) throw new Error('User progress not found');
  
  // Check if user has infinite hearts subscription
  const hasInfiniteHearts = await checkSubscriptionStatus(user.id);
  
  // If user has infinite hearts, don't reduce hearts
  if (hasInfiniteHearts) {
    return { success: true, hasInfiniteHearts: true };
  }
  
  if (currentUserProgress.hearts === 0) {
    return { error: 'hearts', hearts: 0 };
  }

  const newHearts = Math.max(currentUserProgress.hearts - 1, 0);
  
  await db
    .update(userProgress)
    .set({
      hearts: newHearts,
    })
    .where(eq(userProgress.userId, user.id));

  revalidatePath('/games/SubScribe');
  revalidatePath('/shop');
  revalidatePath('/learn');
  revalidatePath('/leaderboard');
  
  return { success: true, hearts: newHearts, hasInfiniteHearts: false };
};
