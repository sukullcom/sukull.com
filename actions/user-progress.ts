"use server";

import { POINTS_TO_REFILL } from "@/constants";
import db from "@/db/drizzle";
import { getCourseById, getUserProgress } from "@/db/queries";
import { challengeProgress, challenges, schools, userProgress } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";

export const updateTotalPointsForSchools = async () => {
  const allSchools = await db.query.schools.findMany();
  for (const school of allSchools) {
    const schoolPointsResult = await db.query.userProgress.findMany({
      where: eq(userProgress.schoolId, school.id),
      columns: { points: true },
    });
    const totalPoints = schoolPointsResult.reduce(
      (sum, user) => sum + (user.points || 0),
      0
    );
    await db
      .update(schools)
      .set({ totalPoints })
      .where(eq(schools.id, school.id));
  }
};

export const upsertUserSchool = async (schoolId: number) => {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const userId = user.uid;

  const existingUserProgress = await getUserProgress();
  if (existingUserProgress) {
    await db
      .update(userProgress)
      .set({ schoolId })
      .where(eq(userProgress.userId, userId));
    await updateTotalPointsForSchools();
  } else {
    const userName = user.name || "User";
    const userImageSrc = user.picture || "/mascot_purple.svg";

    await db.insert(userProgress).values({
      userId,
      schoolId,
      userName,
      userImageSrc,
    });
    await updateTotalPointsForSchools();
  }
};

export const upsertUserProgress = async (courseId: number) => {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const userId = user.uid;

  const course = await getCourseById(courseId);
  if (!course) throw new Error("Course not found");
  if (!course.units.length || !course.units[0].lessons.length) {
    throw new Error("Course is empty");
  }

  const existing = await getUserProgress();
  const userName = user.name || "User";
  const userImageSrc = user.picture || "/mascot_purple.svg";

  if (existing) {
    await db
      .update(userProgress)
      .set({
        activeCourseId: courseId,
        userName,
        userImageSrc,
      })
      .where(eq(userProgress.userId, userId));
    revalidatePath("/courses");
    revalidatePath("/learn");
    redirect("/learn");
  } else {
    await db.insert(userProgress).values({
      userId,
      activeCourseId: courseId,
      userName,
      userImageSrc,
    });
    revalidatePath("/courses");
    revalidatePath("/learn");
    redirect("/learn");
  }
};

export const reduceHearts = async (challengeId: number) => {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const userId = user.uid;

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
  const existingCP = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId)
    ),
  });
  const isPractice = !!existingCP;

  if (isPractice) {
    return { error: "practice" };
  }
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
  const currentUserProgress = await getUserProgress();
  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  if (currentUserProgress.hearts === 5) {
    throw new Error("Hearts are already full");
  }
  if (currentUserProgress.points < POINTS_TO_REFILL) {
    throw new Error("Not enough points");
  }

  await db
    .update(userProgress)
    .set({
      hearts: 5,
      points: currentUserProgress.points - POINTS_TO_REFILL,
    })
    .where(eq(userProgress.userId, currentUserProgress.userId));

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
};
