// actions/daily-streak.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, userDailyStreak } from "@/db/schema";
import { eq, and, gte, lt, desc, asc, gt, isNotNull, sql } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
import { calculateStreakBonus } from "@/constants";

/**
 * Utility functions for consistent UTC+3 (Turkey Time) date handling
 * Turkey uses UTC+3 timezone year-round
 */
function getTurkeyNow(): Date {
  const now = new Date();
  // Add 3 hours to convert from UTC to UTC+3 (Turkey Time)
  const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return turkeyTime;
}

function getTurkeyToday(): Date {
  const now = getTurkeyNow();
  // Get today's date in Turkey timezone (UTC+3)
  const turkeyToday = new Date(Date.UTC(
    now.getUTCFullYear(), 
    now.getUTCMonth(), 
    now.getUTCDate()
  ));
  return turkeyToday;
}

function getTurkeyDateFromTimestamp(timestamp: Date | string): Date {
  const date = new Date(timestamp);
  // Convert to Turkey timezone and get the date component
  const turkeyTime = new Date(date.getTime() + (3 * 60 * 60 * 1000));
  return new Date(Date.UTC(
    turkeyTime.getUTCFullYear(), 
    turkeyTime.getUTCMonth(), 
    turkeyTime.getUTCDate()
  ));
}

function getTurkeyTomorrow(): Date {
  const today = getTurkeyToday();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow;
}

// Keep the old function names for backward compatibility but use Turkey time
function getUTCNow(): Date {
  return getTurkeyNow();
}

function getUTCToday(): Date {
  return getTurkeyToday();
}

function getUTCDateFromTimestamp(timestamp: Date | string): Date {
  return getTurkeyDateFromTimestamp(timestamp);
}

function getUTCTomorrow(): Date {
  return getTurkeyTomorrow();
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
 * Checks if a daily reset is needed and automatically performs it
 * This runs whenever users interact with the streak system
 * Ensures previous_total_points is updated even without external cron jobs
 */
export async function checkAndPerformDailyResetIfNeeded() {
  try {
    console.log("🔍 Checking if daily reset is needed...");
    
    const turkeyNow = getTurkeyNow();
    const turkeyToday = getTurkeyToday();
    const todayDateString = turkeyToday.toISOString().split('T')[0];
    
    // NEW LOGIC: Check if any user has outdated previous_total_points
    // This indicates we need a daily reset because points were earned but baselines weren't updated
    const usersWithOutdatedBaselines = await db.query.userProgress.findMany({
      columns: {
        userId: true,
        points: true,
        previousTotalPoints: true,
        lastStreakCheck: true,
      },
      where: sql`points != COALESCE(previous_total_points, 0)`, // Find users where points differ from baseline
    });
    
    console.log(`📊 Found ${usersWithOutdatedBaselines.length} users with outdated baselines`);
    
    // If we have users with outdated baselines, check if any of them have old lastStreakCheck dates
    if (usersWithOutdatedBaselines.length > 0) {
      let needsReset = false;
      
      // Check if ANY user has a lastStreakCheck from before today
      for (const user of usersWithOutdatedBaselines) {
        if (!user.lastStreakCheck) {
          needsReset = true; // User never had streak check
          break;
        }
        
        const userCheckDate = getTurkeyDateFromTimestamp(user.lastStreakCheck);
        const userCheckDateString = userCheckDate.toISOString().split('T')[0];
        
        console.log(`👤 User ${user.userId}: points=${user.points}, baseline=${user.previousTotalPoints}, lastCheck=${userCheckDateString}`);
        
        // If user's last check was before today, we need reset
        if (userCheckDateString < todayDateString) {
          console.log(`⏰ User ${user.userId} has old lastStreakCheck (${userCheckDateString} < ${todayDateString})`);
          needsReset = true;
          break;
        }
      }
      
      if (needsReset) {
        console.log("🚀 New day detected! Users have outdated baselines and old streak checks - performing automatic daily reset...");
        await performDailyReset();
        return true;
      } else {
        console.log("📊 Users have outdated baselines but all checks are from today - users earned points after today's reset");
        return false;
      }
    }
    
    // Alternative check: Look for users who might need reset based on time since last reset
    const anyUser = await db.query.userProgress.findFirst({
      columns: {
        lastStreakCheck: true,
      },
      orderBy: [desc(userProgress.lastStreakCheck)],
    });
    
    if (!anyUser?.lastStreakCheck) {
      console.log("📊 No previous streak check found, performing initial reset...");
      await performDailyReset();
      return true;
    }
    
    const lastCheckTurkeyDate = getTurkeyDateFromTimestamp(anyUser.lastStreakCheck);
    const lastCheckDateString = lastCheckTurkeyDate.toISOString().split('T')[0];
    
    console.log(`📅 Most recent check: ${lastCheckDateString}, Today: ${todayDateString} (UTC+3 Turkey Time)`);
    
    // If the most recent check was before today, reset is needed
    if (lastCheckDateString < todayDateString) {
      console.log("⏰ Most recent check is from previous day - performing automatic daily reset...");
      await performDailyReset();
      return true;
    }
    
    console.log("✅ Daily reset not needed - already completed today");
    return false;
  } catch (error) {
    console.error("Error checking for daily reset:", error);
    return false;
  }
}

/**
 * Updates the daily streak for a user - Enhanced with automatic daily reset
 * This is the main function that should be called whenever a user earns points
 */
export async function updateDailyStreak() {
  try {
    // FIRST: Check if we need to perform daily reset (new day detection)
    await checkAndPerformDailyResetIfNeeded();
    
    const user = await getServerUser();
    if (!user) return false;
    
    const userId = user.id;
    
    // Get fresh user's progress data after potential reset
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    if (!progress) return false;
    
    // Get current date (using UTC+3 Turkey Time for consistency)
    const now = getUTCNow();
    const today = getUTCToday();
    
    // Calculate daily goal achievement using current baseline
    const pointsEarnedToday = (progress.points - (progress.previousTotalPoints || 0));
    const dailyTarget = progress.dailyTarget || 50;
    const goalAchieved = pointsEarnedToday >= dailyTarget;
    
    console.log(`📊 STREAK CHECK for user ${userId}:`);
    console.log(`   Current points: ${progress.points}`);
    console.log(`   Previous total: ${progress.previousTotalPoints || 0}`);
    console.log(`   Points earned today: ${pointsEarnedToday}`);
    console.log(`   Daily target: ${dailyTarget}`);
    console.log(`   Goal achieved: ${goalAchieved}`);
    
    if (!goalAchieved) {
      console.log(`❌ Daily goal not achieved yet (${pointsEarnedToday}/${dailyTarget} points)`);
      return false;
    }
    
    // Check if we already have a record for today
    const existingRecord = await db.query.userDailyStreak.findFirst({
      where: and(
        eq(userDailyStreak.userId, userId),
        eq(userDailyStreak.date, today)
      ),
    });
    
    if (existingRecord) {
      if (!existingRecord.achieved) {
        // Update existing record to achieved
        await db.update(userDailyStreak)
          .set({ achieved: true })
          .where(and(
            eq(userDailyStreak.userId, userId),
            eq(userDailyStreak.date, today)
          ));
        
        // Increment streak counter
        await db.update(userProgress)
          .set({
            istikrar: progress.istikrar + 1,
            lastStreakCheck: now,
          })
          .where(eq(userProgress.userId, userId));
        
        console.log(`✅ STREAK: Updated existing record for user ${userId}: ${progress.istikrar + 1} days. Updated record for ${today.toISOString().split('T')[0]} (UTC+3 Turkey Time)`);
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
      
      console.log(`✅ STREAK: Daily goal achieved for user ${userId}. Streak: ${progress.istikrar + 1} days. Record created for ${today.toISOString().split('T')[0]} (UTC+3 Turkey Time)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error updating daily streak:", error);
    return false;
  }
}

/**
 * Updates previous_total_points for all users to their current points
 * This should be called at the end of each day BEFORE checking streaks
 * This sets the baseline for the next day's daily goal calculation
 */
export async function updatePreviousTotalPointsForAllUsers() {
  try {
    console.log("Starting previous_total_points update for all users...");
    
    const now = getUTCNow();
    
    // Get all users who have user progress
    const allUsers = await db.query.userProgress.findMany({
      columns: {
        userId: true,
        points: true,
        previousTotalPoints: true,
      }
    });
    
    console.log(`Updating previous_total_points for ${allUsers.length} users`);
    
    let updatedCount = 0;
    
    // Update previous_total_points to current points for all users
    for (const user of allUsers) {
      await db.update(userProgress)
        .set({
          previousTotalPoints: user.points,
          lastStreakCheck: now,
        })
        .where(eq(userProgress.userId, user.userId));
      
      console.log(`Updated user ${user.userId}: previous_total_points set to ${user.points}`);
      updatedCount++;
    }
    
    console.log(`✅ Updated previous_total_points for ${updatedCount} users`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error("❌ Error updating previous_total_points:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Checks and resets streaks for users who haven't met their daily goals
 * This should be called daily via a cron job or similar mechanism
 */
export async function checkAndResetStreaks() {
  try {
    console.log("Starting daily streak reset check...");
    
    // Get yesterday's date using UTC+3 (Turkey Time)
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
    return { success: true, resetsCount };
  } catch (error) {
    console.error("Error in daily streak reset:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Complete daily reset process - updates previous_total_points for all users
 * then checks and resets streaks for users who missed their goals
 * This is the main function that should be called by the daily cron job
 */
export async function performDailyReset() {
  try {
    console.log("🚀 Starting complete daily reset process...");
    const startTime = Date.now();
    
    // Step 1: Update previous_total_points for all users (sets baseline for next day)
    console.log("📊 Step 1: Updating previous_total_points for all users...");
    const updateResult = await updatePreviousTotalPointsForAllUsers();
    
    if (!updateResult.success) {
      console.error("❌ Failed to update previous_total_points:", updateResult.error);
      return { 
        success: false, 
        error: "Failed to update previous_total_points", 
        details: updateResult.error 
      };
    }
    
    console.log(`✅ Step 1 complete: Updated ${updateResult.updatedCount} users`);
    
    // Step 2: Check and reset streaks for users who missed their goals
    console.log("🎯 Step 2: Checking and resetting streaks...");
    const resetResult = await checkAndResetStreaks();
    
    if (!resetResult.success) {
      console.error("❌ Failed to reset streaks:", resetResult.error);
      return { 
        success: false, 
        error: "Failed to reset streaks", 
        details: resetResult.error 
      };
    }
    
    console.log(`✅ Step 2 complete: Reset ${resetResult.resetsCount} streaks`);
    
    const duration = Date.now() - startTime;
    console.log(`🎉 Daily reset process completed successfully in ${duration}ms`);
    
    return {
      success: true,
      summary: {
        usersUpdated: updateResult.updatedCount,
        streaksReset: resetResult.resetsCount,
        durationMs: duration
      }
    };
    
  } catch (error) {
    console.error("❌ Error in daily reset process:", error);
    return { 
      success: false, 
      error: "Daily reset process failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    };
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
    
    // Create date range for the month using UTC+3 Turkey Time (month is 0-indexed in JS)
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
    
    // Calculate today's points earned using UTC+3 (Turkey Time)
    const now = getUTCNow();
    const today = getUTCToday();
    
    const lastCheck = progress.lastStreakCheck ? new Date(progress.lastStreakCheck) : null;
    const lastCheckDay = lastCheck ? getUTCDateFromTimestamp(lastCheck) : today;
    
    // Calculate difference from baseline (can be negative), regardless of lastStreakCheck timestamp
    const pointsEarnedToday = (progress.points - (progress.previousTotalPoints || 0));
    
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
