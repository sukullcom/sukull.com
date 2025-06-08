// actions/user-progress.ts
'use server';

import { POINTS_TO_REFILL } from '@/constants';
import db from '@/db/drizzle';
import { getCourseById, getUserProgress } from '@/db/queries';
import { challengeProgress, challenges, schools, userProgress, userDailyStreak } from '@/db/schema';
import { and, eq, gt, sql, isNotNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { users } from '@/utils/users';
import { updateDailyStreak } from "./daily-streak";

export const updateTotalPointsForSchools = async () => {
  try {
    // Get all schools with valid IDs
    const schoolIds = await db.select({ id: schools.id })
      .from(schools);
    
    if (!schoolIds.length) return;
    
    // Use a single query with GROUP BY to calculate totals for all schools at once
    const schoolTotals = await db.select({
      schoolId: userProgress.schoolId,
      totalPoints: sql<number>`sum(${userProgress.points} :: int)`,
    })
    .from(userProgress)
    .where(isNotNull(userProgress.schoolId))
    .groupBy(userProgress.schoolId);
    
    // Create a map for quick lookup
    const pointsBySchoolId = new Map(
      schoolTotals.map(row => [row.schoolId, row.totalPoints || 0])
    );
    
    // Prepare batch updates - only one query with all schools
    const updates = schoolIds.map(school => ({
      id: school.id,
      totalPoints: pointsBySchoolId.get(school.id) || 0
    }));
    
    // Update all schools in a single transaction
    await db.transaction(async (tx) => {
      for (const update of updates) {
        await tx.update(schools)
          .set({ totalPoints: update.totalPoints })
          .where(eq(schools.id, update.id));
      }
    });
    
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
    const userImageSrc = user.user_metadata?.avatar_url || '/mascot_purple.svg';
    
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
  const userImageSrc = existing?.userImageSrc || user.user_metadata?.avatar_url || '/mascot_purple.svg';

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
  if (currentUserProgress.hearts === 0) return { error: 'hearts' };

  await db
    .update(userProgress)
    .set({
      hearts: Math.max(currentUserProgress.hearts - 1, 0),
      points: currentUserProgress.points - 10,
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
    
    // Import the streak continuity check
    const { checkStreakContinuity } = await import("./daily-streak");
    
    // Check streak continuity first
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
