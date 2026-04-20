"use server";

import db from "@/db/drizzle";
import { getUserProgress, checkSubscriptionStatus } from "@/db/queries";
import { challengeProgress, challenges, courses, lessons, units, schools, userProgress } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerUser } from "@/lib/auth";
import { updateDailyStreak } from "./daily-streak";
import { SCORING_SYSTEM } from "@/constants";
import { applyTimeBonus } from "@/lib/time-bonus";
import { updateChallengeProgress } from "./daily-challenges";
import { logActivity } from "@/lib/activity-logger";

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

  // Resolve subject name for daily challenge tracking
  let subjectName: string | undefined;
  try {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      columns: { unitId: true },
    });
    if (lesson) {
      const unit = await db.query.units.findFirst({
        where: eq(units.id, lesson.unitId),
        columns: { courseId: true },
      });
      if (unit) {
        const course = await db.query.courses.findFirst({
          where: eq(courses.id, unit.courseId),
          columns: { title: true },
        });
        subjectName = course?.title;
      }
    }
  } catch { /* best-effort */ }

  if (isPractice) {
    const { total: practicePoints } = applyTimeBonus(SCORING_SYSTEM.LESSON_CHALLENGE_PRACTICE);

    await db
      .update(challengeProgress)
      .set({
        completed: true,
        correctCount: (existingChallengeProgress.correctCount ?? 0) + 1,
        lastAttemptedAt: new Date(),
      })
      .where(eq(challengeProgress.id, existingChallengeProgress.id));

    await db
      .update(userProgress)
      .set({
        points: currentUserProgress.points + practicePoints,
      })
      .where(eq(userProgress.userId, userId));

    await updateDailyStreak();
    await updateChallengeProgress(userId, "question_answered", { subject: subjectName });

    revalidatePath("/learn");
    revalidatePath(`/lesson/${lessonId}`);
    return;
  }

  const { total: firstPoints } = applyTimeBonus(SCORING_SYSTEM.LESSON_CHALLENGE_FIRST);

  const now = new Date();
  await db.insert(challengeProgress).values({
    challengeId,
    userId,
    completed: true,
    correctCount: 1,
    incorrectCount: 0,
    lastAttemptedAt: now,
    firstCompletedAt: now,
  });

  await db
    .update(userProgress)
    .set({ points: currentUserProgress.points + firstPoints })
    .where(eq(userProgress.userId, userId));

  await updateDailyStreak();
  await updateChallengeProgress(userId, "question_answered", { subject: subjectName });

  if (currentUserProgress.schoolId) {
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
    } catch {
      // best-effort
    }
  }

  revalidatePath("/learn");
  revalidatePath(`/lesson/${lessonId}`);
};

export async function addPointsToUser(
  pointsToAdd: number,
  meta?: { gameType?: string },
) {
  if (!pointsToAdd || pointsToAdd <= 0) {
    throw new Error("Invalid points amount");
  }

  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const userId = user.id;

  const currentUserProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { points: true, schoolId: true, previousTotalPoints: true, userId: true },
  });
  if (!currentUserProgress) throw new Error("User progress not found");

  const { total: adjustedPoints } = applyTimeBonus(pointsToAdd);
  const newPoints = (currentUserProgress.points || 0) + adjustedPoints;

  await db
    .update(userProgress)
    .set({ points: newPoints })
    .where(eq(userProgress.userId, userId));

  await updateDailyStreak();

  if (meta?.gameType) {
    await updateChallengeProgress(userId, "game_played", { gameType: meta.gameType });
    await updateChallengeProgress(userId, "game_points", { gameType: meta.gameType, points: adjustedPoints });
    logActivity({ userId, eventType: "game_end", page: `/games/${meta.gameType}`, metadata: { gameType: meta.gameType, points: adjustedPoints } });
  }

  if (currentUserProgress.schoolId) {
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
    } catch {
      // School update is best-effort; user points already saved
    }
  }

  revalidatePath("/learn");
  revalidatePath("/lesson");

  return { success: true, pointsAdded: adjustedPoints, newTotal: newPoints };
}

export const reduceHearts = async (challengeId: number) => {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const userId = user.id;
  const currentUserProgress = await getUserProgress();
  if (!currentUserProgress) throw new Error("User progress not found");
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
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

  if (hasInfiniteHearts) {
    await db.insert(challengeProgress).values({
      challengeId,
      userId,
      completed: false,
      correctCount: 0,
      incorrectCount: 1,
      lastAttemptedAt: new Date(),
    });
    return;
  }

  if (currentUserProgress.hearts === 0) return { error: "hearts" };

  const newHeartCount = Math.max(currentUserProgress.hearts - 1, 0);
  const updateFields: Record<string, unknown> = {
    hearts: newHeartCount,
    points: currentUserProgress.points + SCORING_SYSTEM.LESSON_CHALLENGE_PENALTY,
  };
  // Start regen timer if hearts drop below max for the first time
  if (!currentUserProgress.lastHeartRegenAt) {
    updateFields.lastHeartRegenAt = new Date();
  }
  await db
    .update(userProgress)
    .set(updateFields)
    .where(eq(userProgress.userId, userId));

  const existingProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId)
    )
  });

  if (existingProgress) {
    await db
      .update(challengeProgress)
      .set({
        incorrectCount: (existingProgress.incorrectCount ?? 0) + 1,
        lastAttemptedAt: new Date(),
      })
      .where(eq(challengeProgress.id, existingProgress.id));
  } else {
    await db.insert(challengeProgress).values({
      challengeId,
      userId,
      completed: false,
      correctCount: 0,
      incorrectCount: 1,
      lastAttemptedAt: new Date(),
    });
  }

  revalidatePath("/learn");
  revalidatePath(`/lesson/${lessonId}`);
};

/**
 * Awards bonus points when a lesson is fully completed.
 * Returns the bonuses that were awarded so the client can display them.
 */
export async function awardLessonCompletionBonus(
  lessonId: number,
  wrongCount: number
) {
  const user = await getServerUser();
  if (!user) return { completionBonus: 0, perfectBonus: 0 };
  const userId = user.id;

  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: { points: true, schoolId: true },
  });
  if (!progress) return { completionBonus: 0, perfectBonus: 0 };

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    columns: { id: true },
    with: {
      challenges: { columns: { id: true } },
    },
  });
  if (!lesson || lesson.challenges.length === 0)
    return { completionBonus: 0, perfectBonus: 0 };

  const completionBonus = SCORING_SYSTEM.LESSON_COMPLETION_BONUS;
  const perfectBonus = wrongCount === 0 ? SCORING_SYSTEM.PERFECT_LESSON_BONUS : 0;
  const baseTotal = completionBonus + perfectBonus;
  const { total: totalBonus } = applyTimeBonus(baseTotal);

  if (totalBonus > 0) {
    await db
      .update(userProgress)
      .set({ points: progress.points + totalBonus })
      .where(eq(userProgress.userId, userId));

    await updateDailyStreak();
    await updateChallengeProgress(userId, "lesson_completed_perfect", { wrongCount });
    logActivity({ userId, eventType: "lesson_complete", metadata: { lessonId, wrongCount, bonus: totalBonus } });
    revalidatePath("/learn");
  }

  return { completionBonus, perfectBonus };
}
