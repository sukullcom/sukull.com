"use server";

import db from "@/db/drizzle";
import { getUserProgress } from "@/db/queries";
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
  if (currentUserProgress.hearts === 0 && !isPractice) {
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
        hearts: Math.min(currentUserProgress.hearts + 1, 5),
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
  const user = await getServerUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const userId = user.id;

  // Check streak continuity first
  await checkStreakContinuity(userId);

  const currentUserProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { points: true, schoolId: true, previousTotalPoints: true },
  });
  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  // Initialize streak tracking if needed
  if (currentUserProgress.previousTotalPoints === null || currentUserProgress.previousTotalPoints === undefined) {
    await db.update(userProgress)
      .set({
        previousTotalPoints: currentUserProgress.points,
        lastStreakCheck: new Date(),
      })
      .where(eq(userProgress.userId, userId));
  }

  const newPoints = (currentUserProgress.points || 0) + pointsToAdd;
  await db
    .update(userProgress)
    .set({ points: newPoints })
    .where(eq(userProgress.userId, userId));

  // Delay to let update be visible before recalculating streak
  await new Promise(resolve => setTimeout(resolve, 100));
  await updateDailyStreak();

  if (currentUserProgress.schoolId) {
    const schoolUsers = await db.query.userProgress.findMany({
      where: eq(userProgress.schoolId, currentUserProgress.schoolId),
      columns: { points: true },
    });
    const newTotalPoints = schoolUsers.reduce((sum, u) => sum + u.points, 0);
    await db
      .update(schools)
      .set({ totalPoints: newTotalPoints })
      .where(eq(schools.id, currentUserProgress.schoolId));
  }

  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/leaderboard");
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
