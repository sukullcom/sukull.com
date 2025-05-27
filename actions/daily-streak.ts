// actions/daily-streak.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, userDailyStreak } from "@/db/schema";
import { eq, and, gte, lt, desc, asc } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";

/**
 * Updates the daily streak for a user - this is the main function that should be called
 * whenever a user earns points to check if they've met their daily goal
 */
export async function updateDailyStreak() {
  try {
    const user = await getServerUser();
    if (!user) return false;
    
    const userId = user.id;
    
    // Get user's progress data
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    if (!progress) return false;
    
    // Get current date (reset to start of day for date comparison)
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow (for date range comparison)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if we already have a streak record for today
    const existingStreak = await db.query.userDailyStreak.findFirst({
      where: and(
        eq(userDailyStreak.userId, userId),
        gte(userDailyStreak.date, today),
        lt(userDailyStreak.date, tomorrow)
      ),
    });
    
    // Check if this is a new day compared to last streak check
    const lastCheck = progress.lastStreakCheck ? new Date(progress.lastStreakCheck) : null;
    const isNewDay = !lastCheck || lastCheck < today;
    
    let baselinePoints = progress.previousTotalPoints;
    
    // If it's a new day and we don't have a baseline, or baseline is null/undefined
    if (isNewDay && (baselinePoints === null || baselinePoints === undefined)) {
      // Set baseline to current points (start of day tracking)
      baselinePoints = progress.points;
      
      await db.update(userProgress)
        .set({
          previousTotalPoints: baselinePoints,
          lastStreakCheck: now,
        })
        .where(eq(userProgress.userId, userId));
    }
    
    // Calculate points earned today
    const pointsEarnedToday = Math.max(0, progress.points - (baselinePoints || 0));
    const dailyTarget = progress.dailyTarget || 50; // Default to 50 if not set
    
    // Check if daily target has been met
    const metDailyTarget = pointsEarnedToday >= dailyTarget;
    
    // Log only important streak events in production
    if (metDailyTarget) {
      console.log(`User ${userId} reached daily goal: ${pointsEarnedToday}/${dailyTarget} points`);
    }
    
    // Record or update today's achievement status
    if (existingStreak) {
      // Update existing record if target is now met and wasn't before
      if (metDailyTarget && !existingStreak.achieved) {
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
        
        console.log(`Streak increased for user ${userId}: ${progress.istikrar + 1} days`);
        return true;
      }
    } else {
      // Create new record for today
      await db.insert(userDailyStreak).values({
        userId,
        date: today,
        achieved: metDailyTarget
      });
      
      // If target is met, we need to check if this continues a streak or starts a new one
      if (metDailyTarget) {
        // Check if the user achieved their goal yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
        
        const yesterdayRecord = await db.query.userDailyStreak.findFirst({
          where: and(
            eq(userDailyStreak.userId, userId),
            gte(userDailyStreak.date, yesterday),
            lt(userDailyStreak.date, yesterdayEnd)
          ),
        });
        
        // If yesterday was achieved or it's the user's first day (no previous record), continue/start streak
        if (yesterdayRecord?.achieved || progress.istikrar === 0) {
          await db.update(userProgress)
            .set({
              istikrar: progress.istikrar + 1,
              lastStreakCheck: now,
            })
            .where(eq(userProgress.userId, userId));
          
          console.log(`New streak started for user ${userId}: ${progress.istikrar + 1} days`);
          return true;
        } else {
          // Yesterday was not achieved, reset streak to 1
          await db.update(userProgress)
            .set({
              istikrar: 1,
              lastStreakCheck: now,
            })
            .where(eq(userProgress.userId, userId));
          
          console.log(`Streak reset to 1 for user ${userId}`);
          return true;
        }
      } else {
        // Target not met, just update last check time
        await db.update(userProgress)
          .set({
            lastStreakCheck: now,
          })
          .where(eq(userProgress.userId, userId));
      }
    }
    
    // Only update previous points at the start of a new day, not during the day
    // This will be handled by the daily reset function
    
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
    
    // Get yesterday's date
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
    
    // Get all users with active streaks
    const activeStreakUsers = await db.query.userProgress.findMany({
      where: gte(userProgress.istikrar, 1),
    });
    
    // Only log if there are users to process
    if (activeStreakUsers.length > 0) {
      console.log(`Checking ${activeStreakUsers.length} users with active streaks`);
    }
    
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
            previousTotalPoints: user.points, // Set baseline to current points for new day
            lastStreakCheck: new Date(),
          })
          .where(eq(userProgress.userId, user.userId));
        
        console.log(`Streak reset for user ${user.userId}: no activity yesterday`);
      } else if (!yesterdayRecord.achieved) {
        // Reset streak and set baseline for new day
        await db.update(userProgress)
          .set({
            istikrar: 0,
            previousTotalPoints: user.points, // Set baseline to current points for new day
            lastStreakCheck: new Date(),
          })
          .where(eq(userProgress.userId, user.userId));
        
        console.log(`Streak reset for user ${user.userId}: goal not achieved yesterday`);
      }
    }
    
    console.log("Daily streak reset check completed");
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
    
    // Create date range for the month (month is 0-indexed in JS)
    const firstDay = new Date(year, month, 1);
    firstDay.setHours(0, 0, 0, 0);
    
    const lastDay = new Date(year, month + 1, 0);
    lastDay.setHours(23, 59, 59, 999);
    
    // Get all streak achievements for the month
    const achievements = await db.query.userDailyStreak.findMany({
      where: and(
        eq(userDailyStreak.userId, userId),
        gte(userDailyStreak.date, firstDay),
        lt(userDailyStreak.date, new Date(year, month + 1, 1))
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
 * Gets current daily progress for a user
 */
export async function getCurrentDayProgress() {
  try {
    const user = await getServerUser();
    if (!user) return null;
    
    const userId = user.id;
    
    // Get user's progress data
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    if (!progress) return null;
    
    // Check if this is a new day and initialize baseline if needed
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const lastCheck = progress.lastStreakCheck ? new Date(progress.lastStreakCheck) : null;
    const isNewDay = !lastCheck || lastCheck < today;
    
    let baselinePoints = progress.previousTotalPoints;
    
    // If it's a new day and we don't have a baseline, initialize it
    if (isNewDay && (baselinePoints === null || baselinePoints === undefined)) {
      baselinePoints = progress.points;
      
      // Update the baseline for the new day
      await db.update(userProgress)
        .set({
          previousTotalPoints: baselinePoints,
          lastStreakCheck: now,
        })
        .where(eq(userProgress.userId, userId));
    }
    
    // Calculate points earned today
    const pointsEarnedToday = Math.max(0, progress.points - (baselinePoints || 0));
    const dailyTarget = progress.dailyTarget || 50;
    
    return {
      pointsEarnedToday,
      dailyTarget,
      achieved: pointsEarnedToday >= dailyTarget,
      currentStreak: progress.istikrar,
      progressPercentage: Math.min((pointsEarnedToday / dailyTarget) * 100, 100)
    };
  } catch (error) {
    console.error("Error getting current day progress:", error);
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
        lastStreakCheck: new Date(),
      })
      .where(eq(userProgress.userId, userId));
    
    // Streak tracking initialized silently
    return true;
  } catch (error) {
    console.error("Error initializing user streak:", error);
    return false;
  }
}
