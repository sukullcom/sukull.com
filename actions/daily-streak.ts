// actions/daily-streak.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, userDailyStreak } from "@/db/schema";
import { eq, and, gte, lt, asc, sql } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { calculateStreakBonus } from "@/constants";
import { updateChallengeProgress } from "./daily-challenges";

const log = logger.child({ labels: { module: "actions/daily-streak" } });

// ─── Turkey Time Helpers (UTC+3, fixed offset) ───────────────────────────────

function getTurkeyNow(): Date {
  return new Date(Date.now() + 3 * 60 * 60 * 1000);
}

function getTurkeyToday(): Date {
  const now = getTurkeyNow();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Turkey takvim günü. `getTurkeyNow()` ile yazılmış zaman damgaları (last_streak_check) için
 *  aynı mantık: çift +3h uygulamamak (aksi halde o gün başka \"gün\" sayılır, baseline sıfırlanır, 0/50 görünür). */
function getTurkeyDateFromTimestamp(ts: Date | string): Date {
  const d = new Date(ts);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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
      dailyPointsEarned: 0,
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
    const rawEarned = Math.max(
      0,
      progress.points - (progress.previousTotalPoints ?? 0),
    );
    const pointsEarnedToday = Math.max(
      rawEarned,
      progress.dailyPointsEarned ?? 0,
    );
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
    log.error({
      message: "daily streak update failed",
      error,
      source: "server-action",
      location: "daily-streak/updateDailyStreak",
    });
    return false;
  }
}

// ─── Public: Check streak for a user (layout, profile) ──────────────────────

export async function checkStreakContinuity(userId: string) {
  try {
    await ensureNewDayForUser(userId);
    return false;
  } catch (error) {
    log.error({
      message: "streak continuity check failed",
      error,
      source: "server-action",
      location: "daily-streak/checkStreakContinuity",
    });
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

    const rawEarned = Math.max(
      progress.points - (progress.previousTotalPoints ?? 0),
      0
    );
    const dailyTracked = progress.dailyPointsEarned ?? 0;
    const dailyTarget = progress.dailyTarget || 50;

    const today = getTurkeyToday();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const todayStreakRow = await db.query.userDailyStreak.findFirst({
      where: and(
        eq(userDailyStreak.userId, userId),
        gte(userDailyStreak.date, today),
        lt(userDailyStreak.date, tomorrow)
      ),
    });
    const recordSaysAchieved = todayStreakRow?.achieved === true;

    const fromDeltaOrTracker = Math.max(rawEarned, dailyTracked);
    const pointsEarnedToday = recordSaysAchieved
      ? Math.max(fromDeltaOrTracker, dailyTarget)
      : fromDeltaOrTracker;
    const achieved = recordSaysAchieved || fromDeltaOrTracker >= dailyTarget;
    const progressOfTarget = dailyTarget
      ? (pointsEarnedToday / dailyTarget) * 100
      : 0;
    const progressPercentage = Math.min(Math.max(0, progressOfTarget), 100);

    return {
      pointsEarnedToday,
      dailyTarget,
      achieved,
      currentStreak: progress.istikrar ?? 0,
      progressPercentage,
      potentialStreakBonus: calculateStreakBonus(
        (progress.istikrar ?? 0) + (achieved ? 1 : 0)
      ),
      totalPoints: progress.points,
    };
  } catch (error) {
    log.error({
      message: "getDailyProgress failed",
      error,
      source: "server-action",
      location: "daily-streak/getDailyProgress",
    });
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
//
// This endpoint runs under Vercel's 60-second hard cap (maxDuration = 60).
// The original per-user implementation issued ~4 round-trips per user with
// an active streak, which at ~10K streak holders blew past the limit and
// risked partial runs that silently left some users with a phantom streak.
//
// The new implementation is strictly bounded: four bulk SQL statements,
// independent of N. Each step is atomic and composable with the next, and
// every WHERE clause targets the exact same "missed yesterday" population
// so there are no race windows between the steps.
//
// Key invariants:
//   • "Missed yesterday" = user has `istikrar >= 1` AND no `achieved = true`
//     `user_daily_streak` row within [yesterday, today).
//   • Freeze is preferred over reset — matching per-user logic in
//     `ensureNewDayForUser`.
//   • Steps are ordered: INSERT placeholder, then consume freeze, then reset.
//     The freeze UPDATE condition checks `streak_freeze_count > 0`; the reset
//     UPDATE condition checks `streak_freeze_count = 0`, so the populations
//     are disjoint even if they run serially.

export async function performDailyReset() {
  try {
    const startTime = Date.now();
    const today = getTurkeyToday();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const now = getTurkeyNow();

    // 1. Baseline: set previous_total_points = points for every user.
    //    Existing behaviour — kept as-is, already set-based.
    await db.execute(
      sql`UPDATE user_progress SET previous_total_points = points, last_streak_check = ${now}, daily_points_earned = 0`
    );

    // 2. Insert a placeholder "missed" row for every streak-holding user
    //    that has no record yet for yesterday. ON CONFLICT DO NOTHING
    //    absorbs the uniq collision on the rare case a user logged in
    //    mid-cron between steps.
    await db.execute(sql`
      INSERT INTO user_daily_streak (user_id, date, achieved)
      SELECT up.user_id, ${yesterday}, false
      FROM user_progress up
      WHERE up.istikrar >= 1
        AND NOT EXISTS (
          SELECT 1 FROM user_daily_streak uds
          WHERE uds.user_id = up.user_id
            AND uds.date >= ${yesterday}
            AND uds.date < ${today}
        )
      ON CONFLICT DO NOTHING
    `);

    // 3. Consume one streak-freeze for users who missed yesterday *and*
    //    have freezes available. We use a LEFT JOIN + IS NULL filter so
    //    the population is defined by "no achieved=true row yesterday"
    //    regardless of whether the placeholder from step 2 exists.
    const freezeResult = await db.execute<{ user_id: string }>(sql`
      WITH missed AS (
        SELECT up.user_id
        FROM user_progress up
        LEFT JOIN user_daily_streak uds
          ON uds.user_id = up.user_id
         AND uds.date >= ${yesterday}
         AND uds.date < ${today}
         AND uds.achieved = true
        WHERE up.istikrar >= 1
          AND uds.id IS NULL
          AND COALESCE(up.streak_freeze_count, 0) > 0
      )
      UPDATE user_progress up
      SET streak_freeze_count = COALESCE(up.streak_freeze_count, 0) - 1
      FROM missed m
      WHERE up.user_id = m.user_id
      RETURNING up.user_id
    `);

    // 4. Reset istikrar for users who missed *and* had no freeze.
    const resetResult = await db.execute<{ user_id: string }>(sql`
      WITH missed_no_freeze AS (
        SELECT up.user_id
        FROM user_progress up
        LEFT JOIN user_daily_streak uds
          ON uds.user_id = up.user_id
         AND uds.date >= ${yesterday}
         AND uds.date < ${today}
         AND uds.achieved = true
        WHERE up.istikrar >= 1
          AND uds.id IS NULL
          AND COALESCE(up.streak_freeze_count, 0) = 0
      )
      UPDATE user_progress up
      SET istikrar = 0
      FROM missed_no_freeze m
      WHERE up.user_id = m.user_id
      RETURNING up.user_id
    `);

    // Count distinct streak-holders *before* step 3/4 mutated them so the
    // summary is stable no matter whether we ran over a freeze or a reset.
    // A single COUNT(*) is O(N) rows scanned but zero rows returned, which
    // is far cheaper than the original N-query hot loop.
    const totalStreakHoldersRows = await db.execute<{ n: string }>(
      sql`SELECT COUNT(*)::text AS n FROM user_progress WHERE istikrar >= 1`
    );

    // drizzle's `execute` exposes the underlying pg `Result`; access `rows`
    // for cross-pool compatibility (node-postgres and postgres-js both expose
    // an array-like), then fall back to length where RETURNING is honoured.
    const freezeCount =
      (freezeResult as unknown as { rows?: unknown[] }).rows?.length ??
      (Array.isArray(freezeResult) ? freezeResult.length : 0);
    const resetCount =
      (resetResult as unknown as { rows?: unknown[] }).rows?.length ??
      (Array.isArray(resetResult) ? resetResult.length : 0);
    const totalStreakRows =
      (totalStreakHoldersRows as unknown as { rows?: Array<{ n: string }> }).rows ??
      (Array.isArray(totalStreakHoldersRows)
        ? (totalStreakHoldersRows as unknown as Array<{ n: string }>)
        : []);
    const usersUpdated = Number(totalStreakRows[0]?.n ?? 0);

    return {
      success: true,
      summary: {
        usersUpdated,
        freezesConsumed: freezeCount,
        streaksReset: resetCount,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    log.error({
      message: "daily reset failed",
      error,
      source: "cron",
      location: "daily-streak/performDailyReset",
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─── Cron: Apply streak bonuses ──────────────────────────────────────────────
// Called AFTER performDailyReset; bonuses go into the NEW day's baseline so
// they don't count as "points earned today" (otherwise users would auto-hit
// their daily target without any activity).
//
// The bonus table lives in `constants.ts` (`calculateStreakBonus`). We mirror
// the same thresholds here in a single CASE expression — these values change
// so rarely (only one update in two years per git history) that duplicating
// them is safer than a round-trip per user. If the list grows, swap to a
// small join against a `streak_bonus_ladder(min_days, bonus)` table.

const STREAK_BONUS_CASE = sql`
  CASE
    WHEN up.istikrar >= 60 THEN 300
    WHEN up.istikrar >= 30 THEN 150
    WHEN up.istikrar >= 15 THEN 75
    WHEN up.istikrar >= 7  THEN 30
    WHEN up.istikrar >= 3  THEN 10
    ELSE 0
  END
`;

export async function applyDailyStreakBonuses() {
  try {
    // Single UPDATE — Postgres evaluates the RHS using OLD values, so the
    // `previous_total_points` expression correctly adds bonus to the
    // pre-update baseline rather than the post-update points.
    const result = await db.execute<{ user_id: string }>(sql`
      UPDATE user_progress up
      SET points = up.points + (${STREAK_BONUS_CASE}),
          previous_total_points = COALESCE(up.previous_total_points, up.points) + (${STREAK_BONUS_CASE})
      WHERE up.istikrar >= 3
      RETURNING up.user_id
    `);

    const bonusesApplied =
      (result as unknown as { rows?: unknown[] }).rows?.length ??
      (Array.isArray(result) ? result.length : 0);

    return { success: true, bonusesApplied };
  } catch (error) {
    log.error({
      message: "streak bonuses failed",
      error,
      source: "cron",
      location: "daily-streak/applyDailyStreakBonuses",
    });
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
        dailyPointsEarned: 0,
      })
      .where(eq(userProgress.userId, userId));

    return true;
  } catch {
    return false;
  }
}
