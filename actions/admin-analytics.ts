"use server";

import db from "@/db/drizzle";
import {
  users,
  userProgress,
  userDailyStreak,
  challengeProgress,
  challenges,
  lessons,
  units,
  courses,
  activityLog,
  paymentLogs,
  creditTransactions,
  userSubscriptions,
} from "@/db/schema";
import { and, eq, gte, sql, desc, count, inArray } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function isAdmin(): Promise<boolean> {
  try {
    const user = await getServerUser();
    if (!user) return false;
    const record = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { role: true },
    });
    return record?.role === "admin";
  } catch (err) {
    console.error("[admin-analytics] isAdmin check failed:", err);
    return false;
  }
}

/** Internal per-query guard: logs and returns fallback on failure. */
async function safeQuery<T>(
  name: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[admin-analytics] query '${name}' failed:`, err);
    return fallback;
  }
}

/**
 * Top-level guard wrapping the entire action.
 * Guarantees we NEVER throw out of the module — the page keeps rendering
 * even if auth or DB break, and errors land in the server log (Vercel).
 */
async function safeAction<T>(
  name: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    if (!(await isAdmin())) {
      console.warn(`[admin-analytics] action '${name}' called by non-admin`);
      return fallback;
    }
    return await fn();
  } catch (err) {
    console.error(`[admin-analytics] action '${name}' failed:`, err);
    return fallback;
  }
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Fallback shapes ────────────────────────────────────────────────────────

const OVERVIEW_FALLBACK = {
  totalUsers: 0,
  todayActiveUsers: 0,
  weekActiveUsers: 0,
  avgStreak: 0,
  totalPointsToday: 0,
  newUsers7d: 0,
  newUsers30d: 0,
};

const LEARNING_FALLBACK = {
  totalCompleted: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  accuracy: 0,
  topCourses: [] as Array<{
    id: number;
    title: string;
    imageSrc: string;
    completions: number;
  }>,
};

const GAME_FALLBACK = {
  totalSessions: 0,
  games: [] as Array<{ name: string; sessions: number }>,
};

const STREAK_FALLBACK = {
  distribution: { zero: 0, oneToSeven: 0, eightToThirty: 0, thirtyPlus: 0 },
  totalStreakFreezes: 0,
  targetsAchievedToday: 0,
};

const REVENUE_FALLBACK = {
  activeSubscriptions: 0,
  successfulPayments: 0,
  totalCreditsPurchased: 0,
  recentTransactions: [] as Array<{
    id: number;
    userId: string;
    credits: number;
    amount: string;
    status: string;
    createdAt: Date;
  }>,
};

// ─── Overview ───────────────────────────────────────────────────────────────

export async function getOverviewMetrics() {
  return safeAction("getOverviewMetrics", async () => {
    const zero = { v: 0 as number };
    const [
      totalUsersRow,
      todayActiveRow,
      weekActiveRow,
      avgStreakRow,
      totalPointsTodayRow,
      newUsers7dRow,
      newUsers30dRow,
    ] = await Promise.all([
      safeQuery("totalUsers", async () => {
        const [r] = await db.select({ v: count() }).from(users);
        return r ?? zero;
      }, zero),
      safeQuery("todayActive", async () => {
        const [r] = await db
          .select({ v: sql<number>`COUNT(DISTINCT ${activityLog.userId})` })
          .from(activityLog)
          .where(gte(activityLog.createdAt, todayStart()));
        return r ?? zero;
      }, zero),
      safeQuery("weekActive", async () => {
        const [r] = await db
          .select({ v: sql<number>`COUNT(DISTINCT ${activityLog.userId})` })
          .from(activityLog)
          .where(gte(activityLog.createdAt, daysAgo(7)));
        return r ?? zero;
      }, zero),
      safeQuery("avgStreak", async () => {
        const [r] = await db
          .select({ v: sql<number>`AVG(${userProgress.istikrar})` })
          .from(userProgress);
        return r ?? zero;
      }, zero),
      safeQuery("totalPointsToday", async () => {
        const [r] = await db
          .select({
            v: sql<number>`COALESCE(SUM(${userProgress.points} - COALESCE(${userProgress.previousTotalPoints}, 0)), 0)`,
          })
          .from(userProgress);
        return r ?? zero;
      }, zero),
      safeQuery("newUsers7d", async () => {
        const [r] = await db
          .select({ v: count() })
          .from(users)
          .where(gte(users.created_at, daysAgo(7)));
        return r ?? zero;
      }, zero),
      safeQuery("newUsers30d", async () => {
        const [r] = await db
          .select({ v: count() })
          .from(users)
          .where(gte(users.created_at, daysAgo(30)));
        return r ?? zero;
      }, zero),
    ]);

    return {
      totalUsers: Number(totalUsersRow?.v ?? 0),
      todayActiveUsers: Number(todayActiveRow?.v ?? 0),
      weekActiveUsers: Number(weekActiveRow?.v ?? 0),
      avgStreak: Math.round(Number(avgStreakRow?.v ?? 0) * 10) / 10,
      totalPointsToday: Math.max(0, Number(totalPointsTodayRow?.v ?? 0)),
      newUsers7d: Number(newUsers7dRow?.v ?? 0),
      newUsers30d: Number(newUsers30dRow?.v ?? 0),
    };
  }, OVERVIEW_FALLBACK);
}

// ─── Daily Active Users (chart) ─────────────────────────────────────────────

export async function getDailyActiveUsers(days = 30) {
  return safeAction(
    "getDailyActiveUsers",
    async () => {
      const rows = await safeQuery(
        "dailyActiveUsers",
        async () =>
          await db
            .select({
              date: sql<string>`TO_CHAR(${activityLog.createdAt}, 'YYYY-MM-DD')`,
              users: sql<number>`COUNT(DISTINCT ${activityLog.userId})`,
            })
            .from(activityLog)
            .where(gte(activityLog.createdAt, daysAgo(days)))
            .groupBy(sql`TO_CHAR(${activityLog.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`TO_CHAR(${activityLog.createdAt}, 'YYYY-MM-DD') ASC`),
        [] as { date: string; users: number }[]
      );

      const map = new Map(rows.map((r) => [r.date, Number(r.users)]));
      const result: { date: string; users: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = daysAgo(i);
        const key = d.toISOString().slice(0, 10);
        result.push({ date: key, users: map.get(key) ?? 0 });
      }
      return result;
    },
    [] as { date: string; users: number }[]
  );
}

// ─── New Signups (chart) ────────────────────────────────────────────────────

export async function getNewSignups(days = 7) {
  return safeAction(
    "getNewSignups",
    async () => {
      const rows = await safeQuery(
        "newSignups",
        async () =>
          await db
            .select({
              date: sql<string>`TO_CHAR(${users.created_at}, 'YYYY-MM-DD')`,
              count: count(),
            })
            .from(users)
            .where(gte(users.created_at, daysAgo(days)))
            .groupBy(sql`TO_CHAR(${users.created_at}, 'YYYY-MM-DD')`),
        [] as { date: string; count: number }[]
      );

      const map = new Map(rows.map((r) => [r.date, Number(r.count)]));
      const result: { date: string; count: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = daysAgo(i);
        const key = d.toISOString().slice(0, 10);
        result.push({ date: key, count: map.get(key) ?? 0 });
      }
      return result;
    },
    [] as { date: string; count: number }[]
  );
}

// ─── Learning Metrics ───────────────────────────────────────────────────────

export async function getLearningMetrics() {
  return safeAction("getLearningMetrics", async () => {
    const zeroCount = { v: 0 as number };
    const zeroAttempts = { correct: 0 as number, incorrect: 0 as number };

    const [completedRow, attemptsRow, topCourses] = await Promise.all([
      safeQuery("learning.completed", async () => {
        const [r] = await db
          .select({ v: count() })
          .from(challengeProgress)
          .where(eq(challengeProgress.completed, true));
        return r ?? zeroCount;
      }, zeroCount),
      safeQuery("learning.attempts", async () => {
        const [r] = await db
          .select({
            correct: sql<number>`COALESCE(SUM(${challengeProgress.correctCount}), 0)`,
            incorrect: sql<number>`COALESCE(SUM(${challengeProgress.incorrectCount}), 0)`,
          })
          .from(challengeProgress);
        return r ?? zeroAttempts;
      }, zeroAttempts),
      safeQuery(
        "learning.topCourses",
        async () =>
          await db
            .select({
              courseId: courses.id,
              courseTitle: courses.title,
              courseImage: courses.imageSrc,
              completions: count(),
            })
            .from(challengeProgress)
            .innerJoin(challenges, eq(challengeProgress.challengeId, challenges.id))
            .innerJoin(lessons, eq(challenges.lessonId, lessons.id))
            .innerJoin(units, eq(lessons.unitId, units.id))
            .innerJoin(courses, eq(units.courseId, courses.id))
            .where(eq(challengeProgress.completed, true))
            .groupBy(courses.id, courses.title, courses.imageSrc)
            .orderBy(desc(count()))
            .limit(8),
        [] as Array<{
          courseId: number;
          courseTitle: string;
          courseImage: string;
          completions: number;
        }>
      ),
    ]);

    const correct = Number(attemptsRow?.correct ?? 0);
    const incorrect = Number(attemptsRow?.incorrect ?? 0);
    const totalAttempts = correct + incorrect;
    const accuracy = totalAttempts > 0 ? (correct / totalAttempts) * 100 : 0;

    return {
      totalCompleted: Number(completedRow?.v ?? 0),
      totalCorrect: correct,
      totalIncorrect: incorrect,
      accuracy: Math.round(accuracy * 10) / 10,
      topCourses: topCourses.map((c) => ({
        id: c.courseId,
        title: c.courseTitle,
        imageSrc: c.courseImage,
        completions: Number(c.completions),
      })),
    };
  }, LEARNING_FALLBACK);
}

// ─── Game Metrics ───────────────────────────────────────────────────────────

export async function getGameMetrics() {
  return safeAction("getGameMetrics", async () => {
    const games = await safeQuery(
      "gameMetrics",
      async () =>
        await db
          .select({
            page: activityLog.page,
            count: count(),
          })
          .from(activityLog)
          .where(eq(activityLog.eventType, "game_end"))
          .groupBy(activityLog.page)
          .orderBy(desc(count())),
      [] as { page: string | null; count: number }[]
    );

    const totalSessions = games.reduce((sum, g) => sum + Number(g.count), 0);

    return {
      totalSessions,
      games: games.map((g) => ({
        name: (g.page || "").replace("/games/", "") || "bilinmeyen",
        sessions: Number(g.count),
      })),
    };
  }, GAME_FALLBACK);
}

// ─── Streak Metrics ─────────────────────────────────────────────────────────

export async function getStreakMetrics() {
  return safeAction("getStreakMetrics", async () => {
    const zeroDist = {
      zero: 0 as number,
      one_to_seven: 0 as number,
      eight_to_thirty: 0 as number,
      thirty_plus: 0 as number,
    };
    const zeroV = { v: 0 as number };

    const [distRow, freezeRow, targetsTodayRow] = await Promise.all([
      safeQuery("streaks.distribution", async () => {
        const [r] = await db
          .select({
            zero: sql<number>`SUM(CASE WHEN ${userProgress.istikrar} = 0 THEN 1 ELSE 0 END)`,
            one_to_seven: sql<number>`SUM(CASE WHEN ${userProgress.istikrar} BETWEEN 1 AND 7 THEN 1 ELSE 0 END)`,
            eight_to_thirty: sql<number>`SUM(CASE WHEN ${userProgress.istikrar} BETWEEN 8 AND 30 THEN 1 ELSE 0 END)`,
            thirty_plus: sql<number>`SUM(CASE WHEN ${userProgress.istikrar} > 30 THEN 1 ELSE 0 END)`,
          })
          .from(userProgress);
        return r ?? zeroDist;
      }, zeroDist),
      safeQuery("streaks.freezeTotal", async () => {
        const [r] = await db
          .select({
            v: sql<number>`COALESCE(SUM(${userProgress.streakFreezeCount}), 0)`,
          })
          .from(userProgress);
        return r ?? zeroV;
      }, zeroV),
      safeQuery("streaks.targetsToday", async () => {
        const [r] = await db
          .select({ v: count() })
          .from(userDailyStreak)
          .where(
            and(
              gte(userDailyStreak.date, todayStart()),
              eq(userDailyStreak.achieved, true)
            )
          );
        return r ?? zeroV;
      }, zeroV),
    ]);

    return {
      distribution: {
        zero: Number(distRow?.zero ?? 0),
        oneToSeven: Number(distRow?.one_to_seven ?? 0),
        eightToThirty: Number(distRow?.eight_to_thirty ?? 0),
        thirtyPlus: Number(distRow?.thirty_plus ?? 0),
      },
      totalStreakFreezes: Number(freezeRow?.v ?? 0),
      targetsAchievedToday: Number(targetsTodayRow?.v ?? 0),
    };
  }, STREAK_FALLBACK);
}

// ─── Revenue Metrics ────────────────────────────────────────────────────────

export async function getRevenueMetrics() {
  return safeAction("getRevenueMetrics", async () => {
    const zeroV = { v: 0 as number };

    const [activeSubs, completedPayments, totalCreditsPurchased, recentTransactions] =
      await Promise.all([
        safeQuery("revenue.activeSubs", async () => {
          const [r] = await db
            .select({ v: count() })
            .from(userSubscriptions)
            .where(eq(userSubscriptions.status, "active"));
          return r ?? zeroV;
        }, zeroV),
        safeQuery("revenue.completedPayments", async () => {
          const [r] = await db
            .select({ v: count() })
            .from(paymentLogs)
            .where(eq(paymentLogs.status, "success"));
          return r ?? zeroV;
        }, zeroV),
        safeQuery("revenue.totalCreditsPurchased", async () => {
          const [r] = await db
            .select({
              v: sql<number>`COALESCE(SUM(${creditTransactions.creditsAmount}), 0)`,
            })
            .from(creditTransactions)
            .where(eq(creditTransactions.status, "success"));
          return r ?? zeroV;
        }, zeroV),
        safeQuery(
          "revenue.recentTransactions",
          async () =>
            await db
              .select({
                id: creditTransactions.id,
                userId: creditTransactions.userId,
                credits: creditTransactions.creditsAmount,
                amount: creditTransactions.totalPrice,
                status: creditTransactions.status,
                createdAt: creditTransactions.createdAt,
              })
              .from(creditTransactions)
              .orderBy(desc(creditTransactions.createdAt))
              .limit(10),
          [] as Array<{
            id: number;
            userId: string;
            credits: number;
            amount: string;
            status: string;
            createdAt: Date;
          }>
        ),
      ]);

    return {
      activeSubscriptions: Number(activeSubs?.v ?? 0),
      successfulPayments: Number(completedPayments?.v ?? 0),
      totalCreditsPurchased: Number(totalCreditsPurchased?.v ?? 0),
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        credits: t.credits,
        amount: t.amount,
        status: t.status,
        createdAt: t.createdAt,
      })),
    };
  }, REVENUE_FALLBACK);
}

// ─── Top Users Table ────────────────────────────────────────────────────────

export async function getTopUsersTable(limit = 20) {
  return safeAction(
    "getTopUsersTable",
    async () => {
      const rows = await safeQuery(
        "topUsers.rows",
        async () =>
          await db
            .select({
              userId: userProgress.userId,
              userName: userProgress.userName,
              userImageSrc: userProgress.userImageSrc,
              points: userProgress.points,
              istikrar: userProgress.istikrar,
            })
            .from(userProgress)
            .orderBy(desc(userProgress.points))
            .limit(limit),
        [] as Array<{
          userId: string;
          userName: string;
          userImageSrc: string;
          points: number;
          istikrar: number;
        }>
      );

      const userIds = rows.map((r) => r.userId);

      const completions = userIds.length
        ? await safeQuery(
            "topUsers.completions",
            async () =>
              await db
                .select({
                  userId: challengeProgress.userId,
                  count: count(),
                })
                .from(challengeProgress)
                .where(
                  and(
                    eq(challengeProgress.completed, true),
                    inArray(challengeProgress.userId, userIds)
                  )
                )
                .groupBy(challengeProgress.userId),
            [] as { userId: string; count: number }[]
          )
        : [];
      const completionMap = new Map(
        completions.map((c) => [c.userId, Number(c.count)])
      );

      const lastActivity = userIds.length
        ? await safeQuery(
            "topUsers.lastActivity",
            async () =>
              await db
                .select({
                  userId: activityLog.userId,
                  last: sql<Date>`MAX(${activityLog.createdAt})`,
                })
                .from(activityLog)
                .where(inArray(activityLog.userId, userIds))
                .groupBy(activityLog.userId),
            [] as { userId: string; last: Date }[]
          )
        : [];
      const lastActivityMap = new Map(
        lastActivity.map((l) => [l.userId, l.last as unknown as Date])
      );

      return rows.map((r) => ({
        userId: r.userId,
        userName: r.userName,
        userImageSrc: r.userImageSrc,
        points: r.points,
        istikrar: r.istikrar ?? 0,
        completedChallenges: completionMap.get(r.userId) ?? 0,
        lastActivity: lastActivityMap.get(r.userId) ?? null,
      }));
    },
    [] as Array<{
      userId: string;
      userName: string;
      userImageSrc: string;
      points: number;
      istikrar: number;
      completedChallenges: number;
      lastActivity: Date | null;
    }>
  );
}

// ─── Page View Metrics ──────────────────────────────────────────────────────

export async function getPageViewMetrics(days = 7) {
  return safeAction(
    "getPageViewMetrics",
    async () => {
      const rows = await safeQuery(
        "pageViewMetrics",
        async () =>
          await db
            .select({
              page: activityLog.page,
              views: count(),
              uniqueUsers: sql<number>`COUNT(DISTINCT ${activityLog.userId})`,
            })
            .from(activityLog)
            .where(
              and(
                eq(activityLog.eventType, "page_view"),
                gte(activityLog.createdAt, daysAgo(days))
              )
            )
            .groupBy(activityLog.page)
            .orderBy(desc(count()))
            .limit(15),
        [] as { page: string | null; views: number; uniqueUsers: number }[]
      );

      return rows.map((r) => ({
        page: r.page || "(bilinmeyen)",
        views: Number(r.views),
        uniqueUsers: Number(r.uniqueUsers),
      }));
    },
    [] as Array<{ page: string; views: number; uniqueUsers: number }>
  );
}
