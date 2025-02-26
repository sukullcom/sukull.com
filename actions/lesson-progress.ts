// actions/lesson-progress.ts
"use server";

import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerUser } from "@/lib/auth";

export const markLessonComplete = async () => {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const userId = user.id;

  const currentUserProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });
  if (!currentUserProgress) throw new Error("User progress not found");

  // Get today's date (with time zeroed out)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let lastDate: Date | null = currentUserProgress.lastLessonCompletedAt
    ? new Date(currentUserProgress.lastLessonCompletedAt)
    : null;
  if (lastDate) {
    // Zero out the time for a proper date-only comparison
    lastDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  }

  // If the user already completed a lesson today, do nothing.
  if (lastDate && lastDate.getTime() === today.getTime()) {
    return;
  }

  let newStreak: number;
  if (!lastDate) {
    // First lesson ever
    newStreak = 1;
  } else {
    // Calculate difference in days
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    newStreak = diffDays === 1 ? currentUserProgress.istikrar + 1 : 1;
  }

  await db
    .update(userProgress)
    .set({
      istikrar: newStreak,
      lastLessonCompletedAt: today,
    })
    .where(eq(userProgress.userId, userId));

  // Optionally revalidate paths where the header is shown.
  revalidatePath("/learn");
};
