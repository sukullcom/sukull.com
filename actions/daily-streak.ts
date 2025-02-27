// actions/daily-streak.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, userDailyStreak } from "@/db/schema";
import { and, eq, between } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";

export async function updateDailyStreak() {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const userId = user.id;

  let progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });
  if (!progress) throw new Error("User progress not found");

  const now = new Date();
  // Turkey time (UTC+3)
  const turkishNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const todayStr = turkishNow.toISOString().split("T")[0];
  const todayStart = new Date(`${todayStr}T00:00:00+03:00`);

  // Initialize baseline if not already done today
  if (!progress.lastStreakCheck || new Date(progress.lastStreakCheck) < todayStart) {
    await db
      .update(userProgress)
      .set({
        lastStreakCheck: todayStart,
        previousTotalPoints: progress.points,
      })
      .where(eq(userProgress.userId, userId));
    progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    if (!progress) throw new Error("User progress not found after initialization");
  }

  // Only update the streak if today’s baseline is still active (i.e. not updated yet)
  if (progress.lastStreakCheck && progress.lastStreakCheck.getTime() === todayStart.getTime()) {
    const baseline = progress.previousTotalPoints ?? 0;
    const dailyEarned = progress.points - baseline;
    const achieved = dailyEarned >= progress.dailyTarget;
    if (achieved) {
      await db
        .update(userProgress)
        .set({
          istikrar: progress.istikrar + 1,
          lastStreakCheck: turkishNow, // mark that today's streak is applied
        })
        .where(eq(userProgress.userId, userId));
      progress = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
      });
      if (!progress) throw new Error("User progress not found after streak update");
    }
    // Insert or update a record in the daily streak table for today
    const existing = await db.query.userDailyStreak.findFirst({
      where: and(
        eq(userDailyStreak.userId, userId),
        eq(userDailyStreak.date, todayStart)
      ),
    });
    if (existing) {
      await db
        .update(userDailyStreak)
        .set({ achieved })
        .where(eq(userDailyStreak.id, existing.id));
    } else {
      await db.insert(userDailyStreak).values({
        userId,
        date: todayStart,
        achieved,
      });
    }
  }

  return progress.istikrar;
}


export async function getUserDailyStreakForMonth(month: number, year: number) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const userId = user.id;

  // Determine the first and last day of the month in Turkey time.
  // Format as ISO strings so that comparison works correctly.
  const firstDay = new Date(`${year}-${month.toString().padStart(2, "0")}-01T00:00:00+03:00`);
  // For the last day, compute the first day of the next month.
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const firstDayNextMonth = new Date(`${nextMonthYear}-${nextMonth.toString().padStart(2, "0")}-01T00:00:00+03:00`);

  const records = await db.query.userDailyStreak.findMany({
    where: and(
      eq(userDailyStreak.userId, userId),
      between(userDailyStreak.date, firstDay, firstDayNextMonth)
    ),
  });
  // Map each record to { date: "YYYY-MM-DD", achieved }
  return records.map(r => ({
    date: new Date(r.date).toISOString().split("T")[0],
    achieved: r.achieved,
  }));
}
