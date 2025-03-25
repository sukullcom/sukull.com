// actions/daily-streak.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, userDailyStreak } from "@/db/schema";
import { and, eq, between } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";

/**
 * Updates the user's daily streak based on their activity
 * This should be called when fetching user profile and when completing challenges
 */
export async function updateDailyStreak() {
  try {
    const user = await getServerUser();
    if (!user) return null;
    
    const userId = user.id;
    
    // Get the user's progress data
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    if (!progress) return null;
    
    // Get the start of today in Turkish time (UTC+3)
    const now = new Date();
    const turkishNow = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // UTC+3 for Turkey
    
    // Create the start of today (midnight)
    const todayStart = new Date(turkishNow);
    todayStart.setHours(0, 0, 0, 0);
    
    // Create the start of yesterday (midnight)
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    // Check if we need to reset or initialize the streak
    // If lastStreakCheck is null or from a previous day
    if (!progress.lastStreakCheck || new Date(progress.lastStreakCheck) < todayStart) {
      // Initialize streak check for today
      await db.update(userProgress)
        .set({
          lastStreakCheck: todayStart,
        })
        .where(eq(userProgress.userId, userId));
      
      // If we've missed a day or more (last check was before yesterday)
      // or if we didn't meet our target yesterday, reset the streak
      if (!progress.lastStreakCheck || 
          new Date(progress.lastStreakCheck) < yesterdayStart || 
          (progress.points - (progress.previousTotalPoints || 0) < progress.dailyTarget)) {
        
        await db.update(userProgress)
          .set({
            istikrar: 0,
            previousTotalPoints: progress.points, // Reset the baseline for today
          })
          .where(eq(userProgress.userId, userId));
      }
    }
    
    // Only update the streak if today's goal has been met
    // and it hasn't been applied yet today
    const pointsEarnedToday = progress.points - (progress.previousTotalPoints || 0);
    
    if (pointsEarnedToday >= progress.dailyTarget) {
      // Update the streak counter and mark today's check as complete
      await db.update(userProgress)
        .set({
          istikrar: progress.istikrar + 1,
          lastStreakCheck: new Date(), // Update the timestamp to now (not just midnight)
          previousTotalPoints: progress.points, // Set the new baseline
        })
        .where(eq(userProgress.userId, userId));
    }
    
    // Get the updated progress
    const updatedProgress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    
    if (!updatedProgress) throw new Error("User progress not found after streak update");
    
    // Insert or update a record in the daily streak table for today
    const existing = await db.query.userDailyStreak.findFirst({
      where: and(
        eq(userDailyStreak.userId, userId),
        eq(userDailyStreak.date, todayStart)
      ),
    });
    
    if (existing) {
      await db.update(userDailyStreak)
        .set({ achieved: pointsEarnedToday >= progress.dailyTarget })
        .where(eq(userDailyStreak.id, existing.id));
    } else {
      await db.insert(userDailyStreak).values({
        userId,
        date: todayStart,
        achieved: pointsEarnedToday >= progress.dailyTarget,
      });
    }
    
    return updatedProgress;
  } catch (error) {
    console.error("Error updating daily streak:", error);
    return null;
  }
}

/**
 * Gets the user's daily streak records for a specific month
 * Used for displaying the streak calendar
 */
export async function getUserDailyStreakForMonth(month: number, year: number) {
  try {
    const currentUser = await getServerUser();
    if (!currentUser) return [];
    
    const userId = currentUser.id;
    
    // Create the first day of the specified month
    const firstDay = new Date(year, month, 1);
    firstDay.setHours(0, 0, 0, 0);
    
    // Create the first day of the next month
    const firstDayNextMonth = new Date(year, month + 1, 1);
    firstDayNextMonth.setHours(0, 0, 0, 0);
    
    // Get all streak records for the user in the specified month
    const records = await db.query.userDailyStreak.findMany({
      where: and(
        eq(userDailyStreak.userId, userId),
        between(userDailyStreak.date, firstDay, firstDayNextMonth)
      ),
    });
    
    return records;
  } catch (error) {
    console.error("Error getting daily streak for month:", error);
    return [];
  }
}
