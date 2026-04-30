"use server";

import db from "@/db/drizzle";
import { challengeProgress, userProgress } from "@/db/schema";
import { getUserRank } from "@/db/queries/leaderboard";
import { getServerUser } from "@/lib/auth";
import { computeUserBadges, type BadgeRow, type UserBadgeStats } from "@/lib/user-badges";
import { and, count, eq } from "drizzle-orm";
import { getRequestLogger } from "@/lib/logger";

export type UserBadgeSummary = {
  badges: BadgeRow[];
  stats: UserBadgeStats;
};

/**
 * Hedefler / rozet ekranı için kullanıcı özetini üretir.
 */
export async function getUserBadgeSummary(): Promise<UserBadgeSummary | null> {
  try {
    const user = await getServerUser();
    if (!user) return null;
    const userId = user.id;

    const [rankData, progressRow, solvedAgg] = await Promise.all([
      getUserRank(),
      db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
        columns: {
          istikrar: true,
          maxAnswerStreak: true,
          schoolId: true,
        },
      }),
      db
        .select({ c: count() })
        .from(challengeProgress)
        .where(
          and(eq(challengeProgress.userId, userId), eq(challengeProgress.completed, true)),
        ),
    ]);

    const totalChallengesCompleted = Number(solvedAgg[0]?.c ?? 0);
    const istikrar = progressRow?.istikrar ?? 0;
    const maxAnswerStreak = progressRow?.maxAnswerStreak ?? 0;
    const hasSchool = progressRow?.schoolId != null;

    const globalRank = rankData?.userRank ?? null;
    let schoolRank: number | null = null;
    if (rankData && typeof rankData.userRankInSchool === "number") {
      schoolRank = rankData.userRankInSchool;
    }

    const schoolInstitutionRank =
      rankData != null && typeof rankData.schoolRank === "number"
        ? rankData.schoolRank
        : null;

    const stats: UserBadgeStats = {
      istikrar,
      maxAnswerStreak,
      totalChallengesCompleted,
      globalRank,
      schoolRank,
      schoolInstitutionRank,
      hasSchool,
    };

    return {
      stats,
      badges: computeUserBadges(stats),
    };
  } catch (error) {
    const log = await getRequestLogger({ labels: { action: "getUserBadgeSummary" } });
    log.error({
      message: "getUserBadgeSummary failed",
      error,
      source: "server-action",
      location: "user-badges/getUserBadgeSummary",
    });
    return null;
  }
}
