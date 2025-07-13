// actions/profile.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, users, schools } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
import { updateDailyStreak, checkStreakContinuity } from "./daily-streak";
import { normalizeAvatarUrl } from '@/utils/avatar';

/**
 * Fetch profile data (user_progress) for the currently authenticated user.
 * Returns defaults if no row found.
 * Now includes a `startDate` field derived from the user's created_at date.
 */
export async function getProfileDataOnServer() {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const userId = user.id;

  // Check streak continuity first
  await checkStreakContinuity(userId);

  // Get current progress to check if streak tracking is initialized
  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  // Initialize streak tracking if needed
  if (progress && (progress.previousTotalPoints === null || progress.previousTotalPoints === undefined)) {
    await db.update(userProgress)
      .set({
        previousTotalPoints: progress.points,
        lastStreakCheck: new Date(),
      })
      .where(eq(userProgress.userId, userId));
  }

  // Update daily streak after checking continuity
  await updateDailyStreak();

  const row = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: {
      userName: true,
      userImageSrc: true,
      profileLocked: true,
      schoolId: true,
      istikrar: true,
      dailyTarget: true,
      profileEditingUnlocked: true,
      studyBuddyUnlocked: true,
      codeShareUnlocked: true,
    },
  });

  // Fetch the user record to extract the creation date as startDate
  const userRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { created_at: true },
  });
  // Use the created_at field (if available) as the start date; otherwise, fallback to today's date.
  const startDate = userRow
    ? new Date(userRow.created_at).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  if (!row) {
    return {
      userName: "Anonymous",
      userImageSrc: "/mascot_purple.svg",
      profileLocked: false,
      schoolId: null,
      istikrar: 0,
      dailyTarget: 50,
      startDate,
    };
  }

  return { ...row, startDate };
}


// 2) Fetch all schools
export async function getAllSchoolsOnServer() {
  return await db.query.schools.findMany({
    orderBy: (tbl, { asc }) => [asc(tbl.name)],
  });
}

/**
 * Update profile data.
 * All fields can be updated at any time.
 */
export async function updateProfileAction(
  newName: string,
  newImage: string,
  schoolId: number | null,
  newDailyTarget: number // Günlük hedeflenen puan
) {
  const user = await getServerUser();
  if (!user) throw new Error("Not authenticated");
  const userId = user.id;

  // Grab existing user_progress row
  const progressRow = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });
  if (!progressRow) {
    throw new Error("No user_progress row found for this user.");
  }

  // Update all fields - profile is never locked
    await db
      .update(userProgress)
      .set({
        userName: newName || "Anonymous",
        userImageSrc: normalizeAvatarUrl(newImage),
        schoolId,
        dailyTarget: newDailyTarget,
      profileLocked: false, // Always set to false to ensure profile is never locked
      })
      .where(eq(userProgress.userId, userId));

  // Update the "users" table as well
  const existingUserRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (existingUserRow) {
    await db
      .update(users)
      .set({
        name: newName || "User",
        avatar: normalizeAvatarUrl(newImage),
        updated_at: new Date(),
      })
      .where(eq(users.id, userId));
  } else {
    await db.insert(users).values({
      id: userId,
      email: user.email ?? "",
      name: newName || "User",
      avatar: normalizeAvatarUrl(newImage),
      provider: "email",
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  return true;
}

/**
 * Gets the user's profile data including daily streak
 * This should be called when loading the profile page
 */
export async function getUserProfile() {
  try {
    const user = await getServerUser();
    if (!user) return null;
    
    const userId = user.id;
    
    // Check streak continuity first
    await checkStreakContinuity(userId);
    
    // Update daily streak after checking continuity
    // This ensures the streak is up-to-date when shown to the user
    await updateDailyStreak();
    
    // Get user progress
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      with: {
        school: true,
      },
    });
    
    if (!progress) return null;
    
    // Format the current streak
    const streak = {
      current: progress.istikrar,
      target: progress.dailyTarget,
      progress: progress.points - (progress.previousTotalPoints || 0),
    };
    
    // Calculate user registration date (for streak calendar)
    const createDate = user.created_at || new Date();
    const startDate = new Date(createDate).toISOString();
    
    return {
      userId: progress.userId,
      userName: progress.userName,
      userImageSrc: progress.userImageSrc,
      hearts: progress.hearts,
      points: progress.points,
      dailyTarget: progress.dailyTarget,
      previousPoints: progress.previousTotalPoints || 0,
      streak,
      school: progress.school,
      startDate,
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

/**
 * Updates the user's profile settings
 */
export async function updateUserProfile(data: {
  schoolId?: number;
  userName?: string;
  dailyTarget?: number;
}) {
  try {
    const user = await getServerUser();
    if (!user) throw new Error("Unauthorized");
    
    const userId = user.id;
    
    // Create the update data
    const updateData: any = {};
    
    if (data.schoolId) {
      // Verify the school exists
      const school = await db.query.schools.findFirst({
        where: eq(schools.id, data.schoolId),
      });
      
      if (!school) throw new Error("School not found");
      
      updateData.schoolId = data.schoolId;
    }
    
    if (data.userName) {
      updateData.userName = data.userName;
    }
    
    if (data.dailyTarget) {
      // Ensure daily target is a reasonable value
      if (data.dailyTarget < 10 || data.dailyTarget > 1000) {
        throw new Error("Daily target must be between 10 and 1000");
      }
      
      updateData.dailyTarget = data.dailyTarget;
    }
    
    // Only update if we have data to update
    if (Object.keys(updateData).length > 0) {
      await db.update(userProgress)
        .set(updateData)
        .where(eq(userProgress.userId, userId));
    }
    
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return false;
  }
}
