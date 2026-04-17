// actions/daily-streak.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, userDailyStreak } from "@/db/schema";
import { eq, and, gte, lt, asc, sql } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
import { calculateStreakBonus } from "@/constants";
import { updateChallengeProgress } from "./daily-challenges";

// ─── Turkey Time Helpers (UTC+3, fixed offset) ───────────────────────────────

function getTurkeyNow(): Date {
  return new Date(Date.now() + 3 * 60 * 60 * 1000);
}

function getTurkeyToday(): Date {
  const now = getTurkeyNow();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getTurkeyDateFromTimestamp(ts: Date | string): Date {
  const d = new Date(ts);
  const shifted = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

function getTurkeyTodayString(): string {
  const t = getTurkeyToday();
  return t.toISOString().split("T")[0];
}

// ─── Core: Per-User New-Day Check ────────────────────────────────────────────
// Called once per user interaction. Handles baseline reset + streak continuity.

async function ensureNewDayForUser(userId: string) {
  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });
  if (!progress) return;

  const today = getTurkeyToday();
  const lastCheck = progress.lastStreakCheck
    ? getTurkeyDateFromTimestamp(progress.lastStreakCheck)
    : null;

  // Already processed today — nothing to do
  if (lastCheck && lastCheck.getTime() === today.getTime()) return;

  const now = getTurkeyNow();

  // STEP 1: Snapshot baseline for the new day
  await db
    .update(userProgress)
    .set({
      previousTotalPoints: progress.points,
      lastStreakCheck: now,
    })
    .where(eq(userProgress.userId, userId));

  // STEP 2: Check yesterday — did the user meet the goal?
  if (lastCheck) {
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const daysBetween = Math.round(
      (today.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)
    );

    let missedGoal = false;

    if (daysBetween === 1) {
      // Normal case: check yesterday's record
      const yesterdayRecord = await db.query.userDailyStreak.findFirst({
        where: and(
          eq(userDailyStreak.userId, userId),
          gte(userDailyStreak.date, yesterday),
          lt(userDailyStreak.date, today)
        ),
      });
      if (!yesterdayRecord || !yesterdayRecord.achieved) {
        missedGoal = true;
        if (!yesterdayRecord) {
          await db.insert(userDailyStreak).values({
            userId,
            date: yesterday,
            achieved: false,
          });
        }
      }
    } else if (daysBetween > 1) {
      // Multi-day gap: user was away for multiple days → streak broken
      missedGoal = true;
      for (let i = 1; i <= Math.min(daysBetween, 30); i++) {
        const missedDay = new Date(lastCheck);
        missedDay.setUTCDate(missedDay.getUTCDate() + i);
        if (missedDay.getTime() >= today.getTime()) break;
        const nextDay = new Date(missedDay);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        const exists = await db.query.userDailyStreak.findFirst({
          where: and(
            eq(userDailyStreak.userId, userId),
            gte(userDailyStreak.date, missedDay),
            lt(userDailyStreak.date, nextDay)
          ),
        });
        if (!exists) {
          await db.insert(userDailyStreak).values({
            userId,
            date: missedDay,
            achieved: false,
          });
        }
      }
    }

    // STEP 3: Reset or freeze
    if (missedGoal && progress.istikrar > 0) {
      const freezeCount = progress.streakFreezeCount ?? 0;
      if (freezeCount > 0 && daysBetween === 1) {
        await db
          .update(userProgress)
          .set({ streakFreezeCount: freezeCount - 1 })
          .where(eq(userProgress.userId, userId));
      } else {
        await db
          .update(userProgress)
          .set({ istikrar: 0 })
          .where(eq(userProgress.userId, userId));
      }
    }
  }
}

// ─── Update Daily Streak (called after earning points) ───────────────────────

export async function updateDailyStreak() {
  try {
    const user = await getServerUser();
    if (!user) return false;
    const userId = user.id;

    await ensureNewDayForUser(userId);

    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    if (!progress) return false;

    const today = getTurkeyToday();
    const pointsEarnedToday = progress.points - (progress.previousTotalPoints ?? 0);
    const dailyTarget = progress.dailyTarget || 50;
    const percentage = Math.round((pointsEarnedToday / dailyTarget) * 100);

    await updateChallengeProgress(userId, "daily_target_progress", { percentage });

    if (pointsEarnedToday < dailyTarget) return false;

    // Check if today is already marked as achieved
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todayRecord = await db.query.userDailyStreak.findFirst({
      where: and(
        eq(userDailyStreak.userId, userId),
        gte(userDailyStreak.date, today),
        lt(userDailyStreak.date, tomorrow)
      ),
    });

    if (todayRecord?.achieved) return false; // Already counted today

    const now = getTurkeyNow();

    if (todayRecord) {
      await db
        .update(userDailyStreak)
        .set({ achieved: true })
        .where(eq(userDailyStreak.id, todayRecord.id));
    } else {
      await db.insert(userDailyStreak).values({
        userId,
        date: today,
        achieved: true,
      });
    }

    await db
      .update(userProgress)
      .set({
        istikrar: progress.istikrar + 1,
        lastStreakCheck: now,
      })
      .where(eq(userProgress.userId, userId));

    return true;
  } catch (error) {
    console.error("Error updating daily streak:", error);
    return false;
  }
}

// ─── Public: Check streak for a user (layout, profile) ──────────────────────

export async function checkStreakContinuity(userId: string) {
  try {
    await ensureNewDayForUser(userId);
    return false;
  } catch (error) {
    console.error("Error checking streak continuity:", error);
    return false;
  }
}

// ─── Get streak count ────────────────────────────────────────────────────────

export async function getStreakCount(userId: string) {
  try {
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      columns: { istikrar: true },
    });
    return progress?.istikrar ?? 0;
  } catch {
    return 0;
  }
}

// ─── Get daily progress for current user ─────────────────────────────────────

export async function getCurrentDayProgress() {
  try {
    const user = await getServerUser();
    if (!user) return null;
    const userId = user.id;

    await ensureNewDayForUser(userId);

    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    if (!progress) return null;

    const pointsEarnedToday = Math.max(
      progress.points - (progress.previousTotalPoints ?? 0),
      0
    );
    const dailyTarget = progress.dailyTarget || 50;
    const achieved = pointsEarnedToday >= dailyTarget;
    const progressPercentage = Math.min((pointsEarnedToday / dailyTarget) * 100, 100);

    return {
      pointsEarnedToday,
      dailyTarget,
      achieved,
      currentStreak: progress.istikrar ?? 0,
      progressPercentage,
      potentialStreakBonus: calculateStreakBonus((progress.istikrar ?? 0) + (achieved ? 1 : 0)),
      totalPoints: progress.points,
    };
  } catch (error) {
    console.error("Error getting daily progress:", error);
    return null;
  }
}

// ─── Monthly streak data (calendar) ─────────────────────────────────────────

export async function getUserDailyStreakForMonth(month: number, year: number) {
  try {
    const user = await getServerUser();
    if (!user) return [];
    const userId = user.id;

    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 1));

    const achievements = await db.query.userDailyStreak.findMany({
      where: and(
        eq(userDailyStreak.userId, userId),
        gte(userDailyStreak.date, firstDay),
        lt(userDailyStreak.date, lastDay)
      ),
      orderBy: asc(userDailyStreak.date),
    });

    return achievements.map((r) => ({
      id: r.id,
      date: r.date.toISOString().split("T")[0],
      achieved: r.achieved,
    }));
  } catch {
    return [];
  }
}

// ─── Cron: Daily reset for ALL users (called once at midnight Turkey) ────────

export async function performDailyReset() {
  try {
    const startTime = Date.now();
    const today = getTurkeyToday();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const now = getTurkeyNow();

    // 1. For every user, set baseline = current points
    await db.execute(
      sql`UPDATE user_progress SET previous_total_points = points, last_streak_check = ${now}`
    );

    // 2. Find users with active streaks who did NOT achieve yesterday
    const usersWithStreaks = await db.query.userProgress.findMany({
      where: gte(userProgress.istikrar, 1),
      columns: { userId: true, istikrar: true, points: true, streakFreezeCount: true },
    });

    let resetsCount = 0;

    for (const user of usersWithStreaks) {
      const tomorrowOfYesterday = new Date(yesterday);
      tomorrowOfYesterday.setUTCDate(tomorrowOfYesterday.getUTCDate() + 1);

      const rec = await db.query.userDailyStreak.findFirst({
        where: and(
          eq(userDailyStreak.userId, user.userId),
          gte(userDailyStreak.date, yesterday),
          lt(userDailyStreak.date, tomorrowOfYesterday)
        ),
      });

      if (!rec || !rec.achieved) {
        // Try streak freeze first
        if ((user.streakFreezeCount ?? 0) > 0) {
          await db
            .update(userProgress)
            .set({ streakFreezeCount: (user.streakFreezeCount ?? 0) - 1 })
            .where(eq(userProgress.userId, user.userId));
        } else {
          await db
            .update(userProgress)
            .set({ istikrar: 0 })
            .where(eq(userProgress.userId, user.userId));
          resetsCount++;
        }

        if (!rec) {
          await db.insert(userDailyStreak).values({
            userId: user.userId,
            date: yesterday,
            achieved: false,
          });
        }
      }
    }

    return {
      success: true,
      summary: {
        usersUpdated: usersWithStreaks.length,
        streaksReset: resetsCount,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("Error in daily reset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─── Cron: Apply streak bonuses ──────────────────────────────────────────────
// Called AFTER performDailyReset; bonuses go into the NEW day's baseline.

export async function applyDailyStreakBonuses() {
  try {
    const usersWithStreaks = await db.query.userProgress.findMany({
      where: gte(userProgress.istikrar, 1),
      columns: { userId: true, istikrar: true, points: true, previousTotalPoints: true },
    });

    let bonusesApplied = 0;

    for (const user of usersWithStreaks) {
      const bonus = calculateStreakBonus(user.istikrar);
      if (bonus > 0) {
        // Add bonus to BOTH points AND baseline so it doesn't count as "today's earned"
        await db
          .update(userProgress)
          .set({
            points: user.points + bonus,
            previousTotalPoints: (user.previousTotalPoints ?? user.points) + bonus,
          })
          .where(eq(userProgress.userId, user.userId));
        bonusesApplied++;
      }
    }

    return { success: true, bonusesApplied };
  } catch (error) {
    console.error("Error applying streak bonuses:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown" };
  }
}

// ─── Initialize streak for new user ──────────────────────────────────────────

export async function initializeUserStreak(userId: string) {
  try {
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    if (!progress) return false;

    await db
      .update(userProgress)
      .set({
        istikrar: 0,
        previousTotalPoints: progress.points,
        lastStreakCheck: getTurkeyNow(),
      })
      .where(eq(userProgress.userId, userId));

    return true;
  } catch {
    return false;
  }
}
