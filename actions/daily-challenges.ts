"use server";

import db from "@/db/drizzle";
import { userDailyChallenges, userProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
import { DAILY_CHALLENGES, type DailyChallengeType } from "@/constants";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

const log = logger.child({ labels: { module: "actions/daily-challenges" } });

const TURKEY_UTC_OFFSET = 3;

function getTurkeyNow(): Date {
  return new Date(Date.now() + TURKEY_UTC_OFFSET * 60 * 60 * 1000);
}

function getTurkeyDateString(): string {
  const now = getTurkeyNow();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTurkeyDayOfWeek(): number {
  const now = getTurkeyNow();
  const jsDay = now.getUTCDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1; // 0=Mon, 6=Sun
}

export async function getTodayChallenge() {
  try {
    const user = await getServerUser();
    if (!user) return null;

    const dateStr = getTurkeyDateString();
    const dayIndex = getTurkeyDayOfWeek();
    const definition = DAILY_CHALLENGES[dayIndex];

    const existing = await db.query.userDailyChallenges.findFirst({
      where: and(
        eq(userDailyChallenges.userId, user.id),
        eq(userDailyChallenges.date, dateStr),
      ),
    });

    if (existing) {
      return {
        ...definition,
        progress: existing.progress,
        completed: existing.completed,
        rewardClaimed: existing.rewardClaimed,
        dayIndex,
        date: dateStr,
        metadata: (existing.metadata ?? {}) as Record<string, unknown>,
      };
    }

    await db.insert(userDailyChallenges).values({
      userId: user.id,
      date: dateStr,
      challengeDay: dayIndex,
      progress: 0,
      target: definition.target,
      completed: false,
      rewardClaimed: false,
      bonusPoints: definition.bonusPoints,
      metadata: {},
    });

    return {
      ...definition,
      progress: 0,
      completed: false,
      rewardClaimed: false,
      dayIndex,
      date: dateStr,
      metadata: {} as Record<string, unknown>,
    };
  } catch (error) {
    log.error({
      message: "getTodayChallenge failed",
      error,
      source: "server-action",
      location: "daily-challenges/getTodayChallenge",
    });
    return null;
  }
}

type ChallengeActionType =
  | "question_answered"
  | "lesson_completed_perfect"
  | "game_played"
  | "game_points"
  | "daily_target_progress";

interface ChallengeActionMeta {
  subject?: string;
  gameType?: string;
  points?: number;
  wrongCount?: number;
  percentage?: number;
}

export async function updateChallengeProgress(
  userId: string,
  type: ChallengeActionType,
  meta: ChallengeActionMeta = {},
) {
  try {
    const dateStr = getTurkeyDateString();
    const dayIndex = getTurkeyDayOfWeek();
    const definition = DAILY_CHALLENGES[dayIndex];

    let row = await db.query.userDailyChallenges.findFirst({
      where: and(
        eq(userDailyChallenges.userId, userId),
        eq(userDailyChallenges.date, dateStr),
      ),
    });

    if (!row) {
      const [inserted] = await db.insert(userDailyChallenges).values({
        userId,
        date: dateStr,
        challengeDay: dayIndex,
        progress: 0,
        target: definition.target,
        completed: false,
        rewardClaimed: false,
        bonusPoints: definition.bonusPoints,
        metadata: {},
      }).returning();
      row = inserted;
    }

    if (row.completed) return;

    const currentMeta = (row.metadata ?? {}) as Record<string, unknown>;
    let newProgress = row.progress;

    switch (definition.id as DailyChallengeType) {
      case "questions_count": {
        if (type === "question_answered") {
          newProgress = row.progress + 1;
        }
        break;
      }
      case "distinct_subjects": {
        if (type === "question_answered" && meta.subject) {
          const subjects = new Set<string>(
            (currentMeta.subjects as string[] | undefined) ?? [],
          );
          subjects.add(meta.subject.toLowerCase());
          currentMeta.subjects = Array.from(subjects);
          newProgress = subjects.size;
        }
        break;
      }
      case "game_score": {
        if (type === "game_points" && meta.points) {
          const best = Math.max(
            (currentMeta.bestGameScore as number) ?? 0,
            meta.points,
          );
          currentMeta.bestGameScore = best;
          newProgress = best;
        }
        break;
      }
      case "perfect_lessons": {
        if (type === "lesson_completed_perfect" && meta.wrongCount === 0) {
          newProgress = row.progress + 1;
        }
        break;
      }
      case "questions_marathon": {
        if (type === "question_answered") {
          newProgress = row.progress + 1;
        }
        break;
      }
      case "distinct_games": {
        if (type === "game_played" && meta.gameType) {
          const games = new Set<string>(
            (currentMeta.games as string[] | undefined) ?? [],
          );
          games.add(meta.gameType);
          currentMeta.games = Array.from(games);
          newProgress = games.size;
        }
        break;
      }
      case "exceed_target": {
        if (type === "daily_target_progress" && meta.percentage != null) {
          newProgress = Math.round(meta.percentage);
        }
        break;
      }
    }

    if (newProgress === row.progress && definition.id !== "distinct_subjects" && definition.id !== "distinct_games") {
      return;
    }

    const completed = newProgress >= definition.target;

    await db
      .update(userDailyChallenges)
      .set({
        progress: newProgress,
        completed,
        metadata: currentMeta,
      })
      .where(eq(userDailyChallenges.id, row.id));
  } catch (error) {
    log.error({
      message: "updateChallengeProgress failed",
      error,
      source: "server-action",
      location: "daily-challenges/updateChallengeProgress",
      fields: { userId, type },
    });
  }
}

export async function claimChallengeReward() {
  try {
    const user = await getServerUser();
    if (!user) return { success: false };

    const dateStr = getTurkeyDateString();

    const row = await db.query.userDailyChallenges.findFirst({
      where: and(
        eq(userDailyChallenges.userId, user.id),
        eq(userDailyChallenges.date, dateStr),
      ),
    });

    if (!row || !row.completed || row.rewardClaimed) {
      return { success: false };
    }

    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, user.id),
      columns: { points: true },
    });

    if (!progress) return { success: false };

    await db
      .update(userProgress)
      .set({ points: progress.points + row.bonusPoints })
      .where(eq(userProgress.userId, user.id));

    await db
      .update(userDailyChallenges)
      .set({ rewardClaimed: true })
      .where(eq(userDailyChallenges.id, row.id));

    const { updateDailyStreak } = await import("./daily-streak");
    await updateDailyStreak();

    revalidatePath("/learn");
    return { success: true, bonusPoints: row.bonusPoints };
  } catch (error) {
    log.error({
      message: "claimChallengeReward failed",
      error,
      source: "server-action",
      location: "daily-challenges/claimChallengeReward",
    });
    return { success: false };
  }
}
