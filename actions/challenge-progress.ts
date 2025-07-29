"use server";

import db from "@/db/drizzle";
import { getUserProgress, checkSubscriptionStatus } from "@/db/queries";
import { challengeProgress, challenges, schools, userProgress } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerUser } from "@/lib/auth";
import { updateDailyStreak, checkStreakContinuity } from "./daily-streak";

export const upsertChallengeProgress = async (challengeId: number) => {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const userId = user.id;

  const currentUserProgress = await getUserProgress();
  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
  if (!challenge) {
    throw new Error("Challenge not found");
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

  if (isPractice) {
    await db
      .update(challengeProgress)
      .set({ completed: true })
      .where(eq(challengeProgress.id, existingChallengeProgress.id));

    // Check streak continuity and initialize if needed
    await checkStreakContinuity(userId);

    // Initialize streak tracking if needed
    if (currentUserProgress.previousTotalPoints === null || currentUserProgress.previousTotalPoints === undefined) {
      await db.update(userProgress)
        .set({
          previousTotalPoints: currentUserProgress.points,
          lastStreakCheck: new Date(),
        })
        .where(eq(userProgress.userId, userId));
    }

    await db
      .update(userProgress)
      .set({
        points: currentUserProgress.points + 20,
      })
      .where(eq(userProgress.userId, userId));

      // Allow a short delay for the update to be visible
      await new Promise(resolve => setTimeout(resolve, 100));
      await updateDailyStreak();

    revalidatePath("/learn");
    revalidatePath(`/lesson/${lessonId}`);
    revalidatePath("/leaderboard");
    return;
  }

  // Check streak continuity and initialize if needed
  await checkStreakContinuity(userId);

  // Initialize streak tracking if needed
  if (currentUserProgress.previousTotalPoints === null || currentUserProgress.previousTotalPoints === undefined) {
    await db.update(userProgress)
      .set({
        previousTotalPoints: currentUserProgress.points,
        lastStreakCheck: new Date(),
      })
      .where(eq(userProgress.userId, userId));
  }

  // Insert new challenge progress
  await db.insert(challengeProgress).values({
    challengeId,
    userId,
    completed: true,
  });

  await db
    .update(userProgress)
    .set({ points: currentUserProgress.points + 10 })
    .where(eq(userProgress.userId, userId));

  // Allow a short delay so the updated points are visible
  await new Promise(resolve => setTimeout(resolve, 100));
  await updateDailyStreak();

  // Recalculate school total points if needed
  const userSchool = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { schoolId: true },
  });
  if (userSchool?.schoolId) {
    const schoolUsers = await db.query.userProgress.findMany({
      where: eq(userProgress.schoolId, userSchool.schoolId),
      columns: { points: true },
    });
    const newTotalPoints = schoolUsers.reduce((sum, u) => sum + u.points, 0);
    await db
      .update(schools)
      .set({ totalPoints: newTotalPoints })
      .where(eq(schools.id, userSchool.schoolId));
  }

  revalidatePath("/learn");
  revalidatePath(`/lesson/${lessonId}`);
  revalidatePath("/leaderboard");
};

export async function addPointsToUser(pointsToAdd: number) {
  try {
    console.log(`🎮 addPointsToUser called with: ${pointsToAdd} points`);
    
    // Validate input
    if (!pointsToAdd || pointsToAdd <= 0) {
      console.log(`❌ Invalid points amount: ${pointsToAdd}`);
      throw new Error("Invalid points amount");
    }

  const user = await getServerUser();
  if (!user) {
      console.log("❌ User not authenticated");
    throw new Error("Unauthorized");
  }
    
  const userId = user.id;
    console.log(`👤 Processing points for user: ${userId}`);

  // FIRST: Check if daily reset is needed (automatic new day detection)
  const { checkAndPerformDailyResetIfNeeded } = await import("./daily-streak");
  await checkAndPerformDailyResetIfNeeded();

  // Check streak continuity
  const { checkStreakContinuity } = await import("./daily-streak");
  await checkStreakContinuity(userId);

  const currentUserProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
      columns: { points: true, schoolId: true, previousTotalPoints: true, userId: true },
  });
    
  if (!currentUserProgress) {
      console.log(`❌ User progress not found for user: ${userId}`);
    throw new Error("User progress not found");
  }

    console.log(`📊 Current user points: ${currentUserProgress.points}`);

  // Initialize streak tracking if needed
  if (currentUserProgress.previousTotalPoints === null || currentUserProgress.previousTotalPoints === undefined) {
      console.log("🔄 Initializing streak tracking");
    await db.update(userProgress)
      .set({
        previousTotalPoints: currentUserProgress.points,
        lastStreakCheck: new Date(),
      })
      .where(eq(userProgress.userId, userId));
  }

  const newPoints = (currentUserProgress.points || 0) + pointsToAdd;
    console.log(`➕ Updating points from ${currentUserProgress.points} to ${newPoints}`);
    
    // Update user points with error handling
    const updateResult = await db
    .update(userProgress)
    .set({ points: newPoints })
      .where(eq(userProgress.userId, userId))
      .returning({ updatedPoints: userProgress.points, userId: userProgress.userId });

    if (!updateResult || updateResult.length === 0) {
      console.log("❌ Failed to update user points - no rows affected");
      throw new Error("Failed to update user points");
    }

    console.log(`✅ Successfully updated points to: ${updateResult[0].updatedPoints}`);

    // Verify the update
    const verifyUpdate = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: { points: true },
    });
    
    if (verifyUpdate && verifyUpdate.points === newPoints) {
      console.log(`✅ Points update verified: ${verifyUpdate.points}`);
    } else {
      console.log(`⚠️ Points verification failed. Expected: ${newPoints}, Got: ${verifyUpdate?.points}`);
    }

  // Delay to let update be visible before recalculating streak
  await new Promise(resolve => setTimeout(resolve, 100));
  await updateDailyStreak();

    // Update school points if user belongs to a school
  if (currentUserProgress.schoolId) {
      console.log(`🏫 Updating school points for school: ${currentUserProgress.schoolId}`);
      try {
    const schoolUsers = await db.query.userProgress.findMany({
      where: eq(userProgress.schoolId, currentUserProgress.schoolId),
      columns: { points: true },
    });
    const newTotalPoints = schoolUsers.reduce((sum, u) => sum + u.points, 0);
    await db
      .update(schools)
      .set({ totalPoints: newTotalPoints })
      .where(eq(schools.id, currentUserProgress.schoolId));
        console.log(`✅ School points updated to: ${newTotalPoints}`);
      } catch (schoolError) {
        console.error("❌ Error updating school points:", schoolError);
        // Don't throw here - user points were already updated successfully
      }
  }

    // Comprehensive cache revalidation
    console.log("🔄 Revalidating cache paths");
  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/leaderboard");
    revalidatePath("/profile");
    revalidatePath("/games");
    revalidatePath("/games/snakable");
    revalidatePath("/"); // Root path
    
    console.log(`🎉 addPointsToUser completed successfully! Added ${pointsToAdd} points.`);
    return { success: true, pointsAdded: pointsToAdd, newTotal: newPoints };
    
  } catch (error) {
    console.error("❌ Error in addPointsToUser:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack available");
    throw error;
  }
}

export const reduceHearts = async (challengeId: number) => {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const userId = user.id;
  const currentUserProgress = await getUserProgress();
  if (!currentUserProgress) throw new Error("User progress not found");
  const challenge = await db.query.challenges.findFirst({ where: eq(challenges.id, challengeId) });
  if (!challenge) throw new Error("Challenge not found");
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
  
  // If user has infinite hearts, don't reduce hearts or points
  if (hasInfiniteHearts) {
    return; // No error, just continue without reducing hearts
  }
  
  if (currentUserProgress.hearts === 0) return { error: "hearts" };

  await db
    .update(userProgress)
    .set({
      hearts: Math.max(currentUserProgress.hearts - 1, 0),
      points: currentUserProgress.points - 10,
    })
    .where(eq(userProgress.userId, userId));

  // Delay before recalculating streak
  await new Promise(resolve => setTimeout(resolve, 100));
  await updateDailyStreak();

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/leaderboard");
  revalidatePath(`/lesson/${lessonId}`);
};
