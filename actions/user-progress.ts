"use server";

import { POINTS_TO_REFILL } from "@/constants";
import db from "@/db/drizzle";
import { getCourseById, getUserProgress } from "@/db/queries";
import { challengeProgress, challenges, schools, userProgress } from "@/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";


export const updateTotalPointsForSchools = async () => {
  // Get all schools
  const allSchools = await db.query.schools.findMany();

  for (const school of allSchools) {
    // Calculate total points for each school
    const schoolPointsResult = await db.query.userProgress.findMany({
      where: eq(userProgress.schoolId, school.id),
      columns: { points: true },
    });

    const totalPoints = schoolPointsResult.reduce(
      (sum, user) => sum + (user.points || 0),
      0
    );

    // Update the school's total_points
    await db.update(schools).set({
      totalPoints: totalPoints,
    }).where(eq(schools.id, school.id));
  }
};


export const upsertUserSchool = async (schoolId: number) => {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
  }

  const existingUserProgress = await getUserProgress();

  if (existingUserProgress) {
    await db.update(userProgress).set({
      schoolId,
    }).where(eq(userProgress.userId, userId));

    // Update total points for schools after school change
    await updateTotalPointsForSchools(); // Call this function to update the total points for the schools
  } else {
    await db.insert(userProgress).values({
      userId,
      schoolId,
      userName: user.firstName || "User",
      userImageSrc: user.imageUrl || "/mascot_purple.svg",
    });

    // Update total points for schools after inserting user progress
    await updateTotalPointsForSchools(); // Call this function to update the total points for the schools
  }
};

export const upsertUserProgress = async (courseId: number) => {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
  }

  const course = await getCourseById(courseId);

  if (!course) {
    throw new Error("Course not found");
  }

  if (!course.units.length || !course.units[0].lessons.length) {
        throw new Error("Course is empty")
  }

  const existingUserProgress = await getUserProgress();

  if (existingUserProgress) {
    await db.update(userProgress).set({
      activeCourseId: courseId,
      userName: user.firstName || "User",
      userImageSrc: user.imageUrl || "/mascot_purple.svg",
    }).where(eq(userProgress.userId, userId));
    revalidatePath("/courses");
    revalidatePath("/learn");
    redirect("/learn");
  }

  await db.insert(userProgress).values({
    userId,
    activeCourseId: courseId,
    userName: user.firstName || "User",
    userImageSrc: user.imageUrl || "/mascot_purple.svg",
  });

  revalidatePath("/courses");
  revalidatePath("/learn");
  redirect("/learn");
};

export const reduceHearts = async (challengeId: number) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const currentUserProgress = await getUserProgress();
  // TODO: Get user subscription

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });

  if (!challenge) {
    throw new Error("Challenge not found")
  }

  const lessonId = challenge.lessonId

  const existingChallengeProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId)
    ),
  });

  const isPractice = !!existingChallengeProgress;

  if (isPractice) {
    return { error: "practice" };
  }
  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  // TODO: Handle subscription
  if (currentUserProgress.hearts === 0) {
    return { error: "hearts" };
  }

  await db
    .update(userProgress)
    .set({
      hearts: Math.max(currentUserProgress.hearts - 1, 0),
      points: currentUserProgress.points - 10,
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath(`/lesson/${lessonId}`);
};

export const refillHearts = async () => {
  const currentUserProgress = await getUserProgress()

  if (!currentUserProgress) {
    throw new Error("User progress not found")
  }

  if (currentUserProgress.hearts === 5) {
    throw new Error("Hearts are already full")
  }

  if (currentUserProgress.points < POINTS_TO_REFILL) {
    throw new Error("Not enough points")
  }

  await db.update(userProgress).set({
    hearts: 5,
    points: currentUserProgress.points - POINTS_TO_REFILL
  }).where(eq(userProgress.userId, currentUserProgress.userId))

  revalidatePath("/shop")
  revalidatePath("/learn")
  revalidatePath("/quests")
  revalidatePath("/leaderboard")
}
