"use server";

import db from "@/db/drizzle";
import { getUserProgress } from "@/db/queries";
import { challengeProgress, challenges, schools, userProgress } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const upsertChallengeProgress = async (challengeId: number) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const currentUserProgress = await getUserProgress();
  // TODO: Handle subscription query later

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
    ),
  });

  // TODO: Not if user has a subscription
  const isPractice = !!existingChallengeProgress;
  if (currentUserProgress.hearts === 0 && !isPractice) {
    return { error: "hearts" };
  }

  if (isPractice) {
    await db
      .update(challengeProgress)
      .set({
        completed: true,
      })
      .where(eq(challengeProgress.id, existingChallengeProgress.id));

    await db
      .update(userProgress)
      .set({
        hearts: Math.min(currentUserProgress.hearts + 1, 5),
        points: currentUserProgress.points + 2,
      })
      .where(eq(userProgress.userId, userId));

    revalidatePath("/learn");
    revalidatePath("/lesson");
    revalidatePath("/quests");
    revalidatePath("/leaderboard");
    revalidatePath(`/lesson/${lessonId}`);
    return;
  }

  await db.insert(challengeProgress).values({
    challengeId,
    userId,
    completed: true,
  });

  // Update user points
  await db
    .update(userProgress)
    .set({
      points: currentUserProgress.points + 10,
    })
    .where(eq(userProgress.userId, userId));

// Get user's school ID
const userSchool = await db.query.userProgress.findFirst({
  where: eq(userProgress.userId, userId),
  columns: { schoolId: true },
});

if (userSchool?.schoolId) {
  // Recalculate total points for the school
  const schoolUsers = await db.query.userProgress.findMany({
    where: eq(userProgress.schoolId, userSchool.schoolId),
    columns: { points: true },
  });

  const newTotalPoints = schoolUsers.reduce((sum, user) => sum + user.points, 0);

  // Update the total_points for the school
  await db
    .update(schools)
    .set({ totalPoints: newTotalPoints })
    .where(eq(schools.id, userSchool.schoolId));
}

// Revalidate necessary paths

  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath(`/lesson/${lessonId}`);
};


// added for games
// Reusable function to update user points
export async function addPointsToUser(pointsToAdd: number) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Fetch the current user's progress
  const currentUserProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { points: true, schoolId: true },
  });

  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  // Update user points
  const newPoints = (currentUserProgress.points || 0) + pointsToAdd;
  await db
    .update(userProgress)
    .set({ points: newPoints })
    .where(eq(userProgress.userId, userId));

  // Update the user's school's total points if a school is associated
  if (currentUserProgress.schoolId) {
    const schoolUsers = await db.query.userProgress.findMany({
      where: eq(userProgress.schoolId, currentUserProgress.schoolId),
      columns: { points: true },
    });

    const newTotalPoints = schoolUsers.reduce((sum, user) => sum + user.points, 0);

    await db
      .update(schools)
      .set({ totalPoints: newTotalPoints })
      .where(eq(schools.id, currentUserProgress.schoolId));
  }

  // Revalidate paths if necessary
  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
}

