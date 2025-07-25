// actions/daily-streak.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, userDailyStreak } from "@/db/schema";
import { eq, and, gte, lt, desc, asc, gt, isNotNull, sql } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
import { calculateStreakBonus } from "@/constants";

/**
 * Utility functions for consistent UTC date handling
 */
function getUTCNow(): Date {
  return new Date();
}

function getUTCToday(): Date {
  const now = new Date();
  const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return utcToday;
}

function getUTCDateFromTimestamp(timestamp: Date | string): Date {
  const date = new Date(timestamp);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getUTCTomorrow(): Date {
  const today = getUTCToday();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow;
}

/**
 * Check if a user's streak should be reset due to missed days
 * This is called every time the user interacts with the app
 */
export async function checkStreakContinuity(userId: string) {
  try {
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    if (!progress) return false;
    
    // If user has no streak, nothing to check
    if (progress.istikrar === 0) return false;
    
    const now = getUTCNow();
    const today = getUTCToday();
    
    const lastCheck = progress.lastStreakCheck ? new Date(progress.lastStreakCheck) : null;
    
    // If this is the first check ever, initialize
    if (!lastCheck) {
      await db.update(userProgress)
        .set({
          lastStreakCheck: now,
          previousTotalPoints: progress.points,
        })
        .where(eq(userProgress.userId, userId));
      return false;
    }
    
    const lastCheckDay = getUTCDateFromTimestamp(lastCheck);
    
    // If we've already checked today, no need to check again
    if (lastCheckDay.getTime() === today.getTime()) {
      return false;
    }
    
    // Check for missed days between last check and today
    const daysBetween = Math.floor((today.getTime() - lastCheckDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysBetween > 1) {
      // Multiple days missed - reset streak
      console.log(`User ${userId} missed ${daysBetween - 1} days - resetting streak`);
      
      // Create missed day records
      for (let i = 1; i < daysBetween; i++) {
        const missedDay = new Date(lastCheckDay);
        missedDay.setUTCDate(missedDay.getUTCDate() + i);
        
        const nextDay = new Date(missedDay);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        
        const existingRecord = await db.query.userDailyStreak.findFirst({
          where: and(
            eq(userDailyStreak.userId, userId),
            gte(userDailyStreak.date, missedDay),
            lt(userDailyStreak.date, nextDay)
          ),
        });
        
        if (!existingRecord) {
          await db.insert(userDailyStreak).values({
            userId,
            date: missedDay,
            achieved: false
          });
        }
      }
      
      // Reset streak
      await db.update(userProgress)
        .set({
          istikrar: 0,
          lastStreakCheck: now,
          previousTotalPoints: progress.points,
        })
        .where(eq(userProgress.userId, userId));
      
      return true; // Streak was reset
    } else if (daysBetween === 1) {
      // Check if yesterday's goal was achieved
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const todayStart = new Date(yesterday);
      todayStart.setUTCDate(todayStart.getUTCDate() + 1);
      
      const yesterdayRecord = await db.query.userDailyStreak.findFirst({
        where: and(
          eq(userDailyStreak.userId, userId),
          gte(userDailyStreak.date, yesterday),
          lt(userDailyStreak.date, todayStart)
        ),
      });
      
      if (!yesterdayRecord || !yesterdayRecord.achieved) {
        // Yesterday's goal was not achieved - reset streak
        console.log(`User ${userId} did not achieve yesterday's goal - resetting streak`);
        
        // Ensure yesterday has a failed record
        if (!yesterdayRecord) {
          await db.insert(userDailyStreak).values({
            userId,
            date: yesterday,
            achieved: false
          });
        }
        
        // Reset streak
        await db.update(userProgress)
          .set({
            istikrar: 0,
            lastStreakCheck: now,
            previousTotalPoints: progress.points,
          })
          .where(eq(userProgress.userId, userId));
        
        return true; // Streak was reset
      }
    }
    
    // Update last check time
    await db.update(userProgress)
      .set({
        lastStreakCheck: now,
      })
      .where(eq(userProgress.userId, userId));
    
    return false; // No streak reset needed
  } catch (error) {
    console.error("Error checking streak continuity:", error);
    return false;
  }
}

/**
 * Updates the daily streak for a user - this is the main function that should be called
 * whenever a user earns points to check if they've met their daily goal
 */
export async function updateDailyStreak() {
  try {
    const user = await getServerUser();
    if (!user) return false;
    
    const userId = user.id;
    
    // First, check if streak should be reset due to missed days
    await checkStreakContinuity(userId);
    
    // Get fresh user's progress data after potential reset
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    if (!progress) return false;
    
    // Get current date (using UTC for consistency)
    const now = getUTCNow();
    const today = getUTCToday();
    
    // Initialize baseline if needed
    if (progress.previousTotalPoints === null || progress.previousTotalPoints === undefined) {
      await db.update(userProgress)
        .set({
          previousTotalPoints: progress.points,
          lastStreakCheck: now,
        })
        .where(eq(userProgress.userId, userId));
      return false;
    }
    
    // Calculate points earned today (since midnight UTC)
    const lastCheck = progress.lastStreakCheck ? new Date(progress.lastStreakCheck) : null;
    const lastCheckDay = lastCheck ? getUTCDateFromTimestamp(lastCheck) : getUTCToday();
    
    // If it's a new day since last check, reset baseline
    let baselinePoints = progress.previousTotalPoints;
    if (lastCheckDay.getTime() < today.getTime()) {
      baselinePoints = progress.points;
      await db.update(userProgress)
        .set({
          previousTotalPoints: baselinePoints,
          lastStreakCheck: now,
        })
        .where(eq(userProgress.userId, userId));
    }
    
    const pointsEarnedToday = Math.max(0, progress.points - (baselinePoints || 0));
    const dailyTarget = progress.dailyTarget || 50;
    
    // Check if daily target has been met
    const metDailyTarget = pointsEarnedToday >= dailyTarget;
    
    if (!metDailyTarget) {
      // Target not met yet, just update the check time
      await db.update(userProgress)
        .set({
          lastStreakCheck: now,
        })
        .where(eq(userProgress.userId, userId));
      return false;
    }
    
    // Target met! Check if we already have a record for today
    const tomorrow = getUTCTomorrow();
    
    const existingStreak = await db.query.userDailyStreak.findFirst({
      where: and(
        eq(userDailyStreak.userId, userId),
        gte(userDailyStreak.date, today),
        lt(userDailyStreak.date, tomorrow)
      ),
    });
    
    if (existingStreak) {
      // Update existing record if target is now met and wasn't before
      if (!existingStreak.achieved) {
        await db.update(userDailyStreak)
          .set({ achieved: true })
          .where(eq(userDailyStreak.id, existingStreak.id));
        
        // Increment streak counter
        await db.update(userProgress)
          .set({
            istikrar: progress.istikrar + 1,
            lastStreakCheck: now,
          })
          .where(eq(userProgress.userId, userId));
        
        console.log(`✅ STREAK: Updated existing record for user ${userId}: ${progress.istikrar + 1} days. Updated record for ${today.toISOString().split('T')[0]} (UTC)`);
        return true;
      }
    } else {
      // Create new record for today
      await db.insert(userDailyStreak).values({
        userId,
        date: today,
        achieved: true
      });
      
      // Increment streak counter
      await db.update(userProgress)
        .set({
          istikrar: progress.istikrar + 1,
          lastStreakCheck: now,
        })
        .where(eq(userProgress.userId, userId));
      
      console.log(`✅ STREAK: Daily goal achieved for user ${userId}. Streak: ${progress.istikrar + 1} days. Record created for ${today.toISOString().split('T')[0]} (UTC)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error updating daily streak:", error);
    return false;
  }
}

/**
 * Checks and resets streaks for users who haven't met their daily goals
 * This should be called daily via a cron job or similar mechanism
 */
export async function checkAndResetStreaks() {
  try {
    console.log("Starting daily streak reset check...");
    
    // Get yesterday's date using UTC
    const now = getUTCNow();
    const today = getUTCToday();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setUTCDate(yesterdayEnd.getUTCDate() + 1);
    
    // Get all users with active streaks
    const activeStreakUsers = await db.query.userProgress.findMany({
      where: gte(userProgress.istikrar, 1),
    });
    
    console.log(`Checking ${activeStreakUsers.length} users with active streaks`);
    
    let resetsCount = 0;
    
    for (const user of activeStreakUsers) {
      // Check if user achieved their goal yesterday
      const yesterdayRecord = await db.query.userDailyStreak.findFirst({
        where: and(
          eq(userDailyStreak.userId, user.userId),
          gte(userDailyStreak.date, yesterday),
          lt(userDailyStreak.date, yesterdayEnd)
        ),
      });
      
      // If no record for yesterday or not achieved, reset streak
      if (!yesterdayRecord) {
        // Create a record for the missed day
        await db.insert(userDailyStreak).values({
          userId: user.userId,
          date: yesterday,
          achieved: false
        });
        
        // Reset streak and set baseline for new day
        await db.update(userProgress)
          .set({
            istikrar: 0,
            previousTotalPoints: user.points,
            lastStreakCheck: now,
          })
          .where(eq(userProgress.userId, user.userId));
        
        console.log(`Streak reset for user ${user.userId}: no activity yesterday`);
        resetsCount++;
      } else if (!yesterdayRecord.achieved) {
        // Reset streak and set baseline for new day
        await db.update(userProgress)
          .set({
            istikrar: 0,
            previousTotalPoints: user.points,
            lastStreakCheck: now,
          })
          .where(eq(userProgress.userId, user.userId));
        
        console.log(`Streak reset for user ${user.userId}: goal not achieved yesterday`);
        resetsCount++;
      }
    }
    
    console.log(`Daily streak reset check completed. Reset ${resetsCount} streaks.`);
    return true;
  } catch (error) {
    console.error("Error in daily streak reset:", error);
    return false;
  }
}

/**
 * Gets the streak count for a user
 */
export async function getStreakCount(userId: string) {
  try {
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    return progress?.istikrar || 0;
  } catch (error) {
    console.error("Error getting streak count:", error);
    return 0;
  }
}

/**
 * Gets the daily streak achievements for a specific month
 * Used by the streak calendar component
 */
export async function getUserDailyStreakForMonth(month: number, year: number) {
  try {
    const user = await getServerUser();
    if (!user) return [];
    
    const userId = user.id;
    
    // Create date range for the month using UTC (month is 0-indexed in JS)
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 1)); // First day of next month
    
    // Get all streak achievements for the month
    const achievements = await db.query.userDailyStreak.findMany({
      where: and(
        eq(userDailyStreak.userId, userId),
        gte(userDailyStreak.date, firstDay),
        lt(userDailyStreak.date, lastDay)
      ),
      orderBy: asc(userDailyStreak.date),
    });
    
    return achievements.map(record => ({
      id: record.id,
      date: record.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      achieved: record.achieved
    }));
  } catch (error) {
    console.error("Error getting monthly streak achievements:", error);
    return [];
  }
}

/**
 * Apply streak bonuses to users who have active streaks
 * This should be called at the end of each day via cron job
 */
export async function applyDailyStreakBonuses() {
  try {
    console.log('Starting daily streak bonus application...');
    
    // Get all users with active streaks
    const usersWithStreaks = await db.query.userProgress.findMany({
      where: and(
        gt(userProgress.istikrar, 0),
        isNotNull(userProgress.lastStreakCheck)
      ),
      columns: {
        userId: true,
        istikrar: true,
        points: true,
      }
    });
    
    console.log(`Found ${usersWithStreaks.length} users with active streaks`);
    
    let bonusesApplied = 0;
    
    for (const user of usersWithStreaks) {
      const streakBonus = calculateStreakBonus(user.istikrar);
      
      if (streakBonus > 0) {
        // Apply streak bonus
        await db.update(userProgress)
          .set({
            points: user.points + streakBonus,
          })
          .where(eq(userProgress.userId, user.userId));
        
        console.log(`Applied ${streakBonus} streak bonus to user ${user.userId} (${user.istikrar} day streak)`);
        bonusesApplied++;
      }
    }
    
    // Update school totals after applying bonuses
    const result = await db.execute(sql`
      WITH school_points AS (
        SELECT 
          school_id,
          SUM(points::int) as total_points
        FROM user_progress 
        WHERE school_id IS NOT NULL
        GROUP BY school_id
      )
      UPDATE schools 
      SET total_points = COALESCE(sp.total_points, 0)
      FROM school_points sp
      WHERE schools.id = sp.school_id;
    `);
    
    console.log(`Daily streak bonuses completed. Applied bonuses to ${bonusesApplied} users.`);
    return { success: true, bonusesApplied };
    
  } catch (error: unknown) {
    console.error("Error applying daily streak bonuses:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred" };
  }
}

/**
 * Get comprehensive daily progress information for the current user
 */
export async function getCurrentDayProgress() {
  try {
    const user = await getServerUser();
    if (!user) throw new Error("User not authenticated");
    
    const userId = user.id;
    
    // Get user progress
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    if (!progress) {
      throw new Error("User progress not found");
    }
    
    // Calculate today's points earned using UTC
    const now = getUTCNow();
    const today = getUTCToday();
    
    const lastCheck = progress.lastStreakCheck ? new Date(progress.lastStreakCheck) : null;
    const lastCheckDay = lastCheck ? getUTCDateFromTimestamp(lastCheck) : today;
    
    let pointsEarnedToday = 0;
    if (lastCheckDay.getTime() === today.getTime()) {
      // Same day - calculate difference from baseline
      pointsEarnedToday = Math.max(0, progress.points - (progress.previousTotalPoints || 0));
    }
    
    const dailyTarget = progress.dailyTarget || 50;
    const achieved = pointsEarnedToday >= dailyTarget;
    const progressPercentage = Math.min((pointsEarnedToday / dailyTarget) * 100, 100);
    
    // Calculate potential streak bonus for tomorrow
    const currentStreak = progress.istikrar || 0;
    const potentialStreakBonus = calculateStreakBonus(currentStreak + (achieved ? 1 : 0));
    
    return {
      pointsEarnedToday,
      dailyTarget,
      achieved,
      currentStreak,
      progressPercentage,
      potentialStreakBonus,
      totalPoints: progress.points,
    };
  } catch (error) {
    console.error("Error getting daily progress:", error);
    return null;
  }
}

/**
 * Initializes streak tracking for a new user or resets it
 */
export async function initializeUserStreak(userId: string) {
  try {
    // Set baseline points to current points
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    if (!progress) return false;
    
    await db.update(userProgress)
      .set({
        istikrar: 0,
        previousTotalPoints: progress.points,
        lastStreakCheck: getUTCNow(),
      })
      .where(eq(userProgress.userId, userId));
    
    return true;
  } catch (error) {
    console.error("Error initializing user streak:", error);
    return false;
  }
}
