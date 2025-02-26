"use server";

import db from "@/db/drizzle";
import { getUserProgress } from "@/db/queries";
import { challengeProgress, challenges, schools, userProgress } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerUser } from "@/lib/auth";

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
    ),
  });

  // Örn: kullanıcı hearts = 0 ise ve ilk defa challenge yapıyorsa engelle
  const isPractice = !!existingChallengeProgress;
  if (currentUserProgress.hearts === 0 && !isPractice) {
    return { error: "hearts" };
  }

  if (isPractice) {
    await db
      .update(challengeProgress)
      .set({ completed: true })
      .where(eq(challengeProgress.id, existingChallengeProgress.id));

    await db
      .update(userProgress)
      .set({
        hearts: Math.min(currentUserProgress.hearts + 1, 5),
        points: currentUserProgress.points + 2,
      })
      .where(eq(userProgress.userId, userId));

    revalidatePath("/learn");
    revalidatePath(`/lesson/${lessonId}`);
    revalidatePath("/leaderboard");
    return;
  }

  // Challenge progress yoksa insert
  await db.insert(challengeProgress).values({
    challengeId,
    userId,
    completed: true,
  });

  // User points +10
  await db
    .update(userProgress)
    .set({ points: currentUserProgress.points + 10 })
    .where(eq(userProgress.userId, userId));

  // Recalculate school total if needed
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

  // Revalidate
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

  const currentUserProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { points: true, schoolId: true },
  });
  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  const newPoints = (currentUserProgress.points || 0) + pointsToAdd;
  await db
    .update(userProgress)
    .set({ points: newPoints })
    .where(eq(userProgress.userId, userId));

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
