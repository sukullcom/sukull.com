// actions/profile.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, users, schools } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
import { applySchoolChangeWithLock } from "@/actions/user-progress";
import { checkStreakContinuity } from "./daily-streak";
import { normalizeAvatarUrl } from '@/utils/avatar';
import { getRequestLogger } from "@/lib/logger";
import { allocateUniqueReferralCodeStandalone } from "@/lib/referral-grant";

/**
 * Fetch profile data (user_progress) for the currently authenticated user.
 * Returns defaults if no row found.
 * Now includes a `startDate` field derived from the user's created_at date.
 */
export async function getProfileDataOnServer() {
  const user = await getServerUser();
  if (!user) throw new Error("Giriş yapmanız gerekiyor.");
  const userId = user.id;

  await checkStreakContinuity(userId);

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
      learningPath: true,
      studentGrade: true,
      onboardingCompletedAt: true,
      learningPathLastSetAt: true,
      learningPathChangeCount: true,
      schoolChangeLockedUntil: true,
      studentGradeChangeLockedUntil: true,
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
      userName: "Anonim",
      userImageSrc: "/mascot_purple.svg",
      profileLocked: false,
      schoolId: null,
      istikrar: 0,
      dailyTarget: 50,
      startDate,
      learningPath: null as string | null,
      studentGrade: null as number | null,
      onboardingCompletedAt: null as Date | null,
      learningPathLastSetAt: null as Date | null,
      learningPathChangeCount: 0,
      schoolChangeLockedUntil: null as Date | null,
      studentGradeChangeLockedUntil: null as Date | null,
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
  if (!user) throw new Error("Giriş yapmanız gerekiyor.");
  const userId = user.id;

  const progressRow = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });
  if (!progressRow) {
    throw new Error("Profil bilgisi bulunamadı. Lütfen sayfayı yenileyip tekrar deneyiniz.");
  }

  if ((schoolId ?? null) !== (progressRow.schoolId ?? null)) {
    await applySchoolChangeWithLock(userId, schoolId);
  }

  await db
    .update(userProgress)
    .set({
      userName: newName || "Anonim",
      userImageSrc: normalizeAvatarUrl(newImage),
      dailyTarget: newDailyTarget,
      profileLocked: false,
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
    const referralCode = await allocateUniqueReferralCodeStandalone();
    await db.insert(users).values({
      id: userId,
      email: user.email ?? "",
      name: newName || "User",
      avatar: normalizeAvatarUrl(newImage),
      provider: "email",
      description: "",
      links: [],
      referralCode,
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
    
    await checkStreakContinuity(userId);

    // Get user progress
    const progress = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
      with: {
        school: true,
      },
    });
    
    if (!progress) return null;
    
    // Format the current streak
    const rawToday = progress.points - (progress.previousTotalPoints || 0);
    const streak = {
      current: progress.istikrar,
      target: progress.dailyTarget,
      progress: Math.max(rawToday, progress.dailyPointsEarned ?? 0),
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
    const log = await getRequestLogger({ labels: { action: "getUserProfile" } });
    log.error({
      message: "getUserProfile failed",
      error,
      source: "server-action",
      location: "profile/getUserProfile",
    });
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
    if (!user) throw new Error("Giriş yapmanız gerekiyor.");
    
    const userId = user.id;

    const progressRow = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, userId),
    });
    if (!progressRow) throw new Error("Profil bulunamadı.");

    if (data.schoolId !== undefined) {
      const nextSchool = data.schoolId ?? null;
      if ((progressRow.schoolId ?? null) !== nextSchool) {
        if (data.schoolId != null) {
          const school = await db.query.schools.findFirst({
            where: eq(schools.id, data.schoolId),
          });
          if (!school) throw new Error("Seçtiğiniz okul bulunamadı.");
        }
        await applySchoolChangeWithLock(userId, nextSchool);
      }
    }

    const updateData: Record<string, unknown> = {};
    
    if (data.userName) {
      updateData.userName = data.userName;
    }
    
    if (data.dailyTarget) {
      // Ensure daily target is a reasonable value
      if (data.dailyTarget < 10 || data.dailyTarget > 1000) {
        throw new Error("Günlük hedef 10 ile 1000 puan arasında olmalıdır.");
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
    const log = await getRequestLogger({ labels: { action: "updateUserProfile" } });
    log.error({
      message: "updateUserProfile failed",
      error,
      source: "server-action",
      location: "profile/updateUserProfile",
    });
    return false;
  }
}
