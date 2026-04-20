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

async function requireAdmin() {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const record = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });
  if (record?.role !== "admin") throw new Error("Forbidden");
  return user;
}

/**
 * Wrap a query in a try/catch so a single failure doesn't crash the whole
 * analytics page. Errors are logged to the server console (visible in Vercel
 * logs) and callers receive a safe fallback value.
 */
async function safeQuery<T>(name: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[admin-analytics] ${name} failed:`, err);
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

// ─── Overview ───────────────────────────────────────────────────────────────

export async function getOverviewMetrics() {
  await requireAdmin();

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
}

// ─── Daily Active Users (chart) ─────────────────────────────────────────────

export async function getDailyActiveUsers(days = 30) {
  await requireAdmin();

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
}

// ─── New Signups (chart) ────────────────────────────────────────────────────

export async function getNewSignups(days = 7) {
  await requireAdmin();

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
}

// ─── Learning Metrics ───────────────────────────────────────────────────────

export async function getLearningMetrics() {
  await requireAdmin();

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
}

// ─── Game Metrics ───────────────────────────────────────────────────────────

export async function getGameMetrics() {
  await requireAdmin();

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
}

// ─── Streak Metrics ─────────────────────────────────────────────────────────

export async function getStreakMetrics() {
  await requireAdmin();

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
}

// ─── Revenue Metrics ────────────────────────────────────────────────────────

export async function getRevenueMetrics() {
  await requireAdmin();

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
}

// ─── Top Users Table ────────────────────────────────────────────────────────

export async function getTopUsersTable(limit = 20) {
  await requireAdmin();

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

  // Use inArray to avoid fragile `= ANY()` SQL and empty-array edge cases
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
}

// ─── Page View Metrics ──────────────────────────────────────────────────────

export async function getPageViewMetrics(days = 7) {
  await requireAdmin();

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
}
