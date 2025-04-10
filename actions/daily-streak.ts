// actions/daily-streak.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, userDailyStreak } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";

/**
 * Updates the daily streak for a user
 * 
 * This function checks if a user has met their daily target and
 * updates their streak accordingly. It will only increment the streak
 * once per calendar day (00:00-23:59).
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
    
    // If streak already recorded for today and achieved, don't update again
    if (existingStreak && existingStreak.achieved) {
      return false;
    }
    
    // Calculate points earned today
    const pointsEarnedToday = progress.points - (progress.previousTotalPoints || 0);
    const dailyTarget = progress.dailyTarget || 50; // Default to 50 if not set
    
    // Check if daily target has been met
    const metDailyTarget = pointsEarnedToday >= dailyTarget;
    
    // Record or update today's achievement status
    if (existingStreak) {
      // Update existing record if target is now met
      if (metDailyTarget && !existingStreak.achieved) {
        await db.update(userDailyStreak)
          .set({ achieved: true })
          .where(eq(userDailyStreak.id, existingStreak.id));
      }
    } else {
      // Create new record
      await db.insert(userDailyStreak).values({
        userId,
        date: today,
        achieved: metDailyTarget
      });
    }
    
    // Only update streak if daily target was met and hasn't been counted yet
    if (metDailyTarget && (!existingStreak || !existingStreak.achieved)) {
      // Increment streak
      await db.update(userProgress)
        .set({
          istikrar: progress.istikrar + 1,
          lastStreakCheck: now,
          previousTotalPoints: progress.points,
        })
        .where(eq(userProgress.userId, userId));
      
      return true;
    } else if (!existingStreak) {
      // Just update the last check time and previous points, but don't increment streak
      await db.update(userProgress)
        .set({
          lastStreakCheck: now,
          previousTotalPoints: progress.points,
        })
        .where(eq(userProgress.userId, userId));
    }
    
    return false;
  } catch (error) {
    console.error("Error updating daily streak:", error);
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
 * Gets the monthly streak achievements for a user
 */
export async function getMonthlyStreakAchievements(userId: string, year: number, month: number) {
  try {
    // Create date range for the month
    const firstDay = new Date(year, month - 1, 1); // JavaScript months are 0-indexed
    const lastDay = new Date(year, month, 0); // Last day of the month
    
    // Get all streak achievements for the month
    const achievements = await db.query.userDailyStreak.findMany({
      where: and(
        eq(userDailyStreak.userId, userId),
        gte(userDailyStreak.date, firstDay),
        lt(userDailyStreak.date, new Date(year, month, 1))
      ),
    });
    
    return achievements;
  } catch (error) {
    console.error("Error getting monthly streak achievements:", error);
    return [];
  }
}
