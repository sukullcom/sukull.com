// actions/profile.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
import { updateDailyStreak } from "./daily-streak";

/**
 * Fetch profile data (user_progress) for the currently authenticated user.
 * Returns defaults if no row found.
 * Now includes a `startDate` field derived from the user's created_at date.
 */
export async function getProfileDataOnServer() {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const userId = user.id;

  // Update daily streak before fetching profile data
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
 * - If the profile is not locked, update userName, userImageSrc, schoolId and lock those fields.
 * - Regardless of profileLocked, always update the dailyTarget so that it remains editable.
 */
export async function updateProfileAction(
  newName: string,
  newImage: string,
  schoolId: number,
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

  // If profile (other than dailyTarget) is locked, update only dailyTarget.
  if (progressRow.profileLocked) {
    await db
      .update(userProgress)
      .set({
        dailyTarget: newDailyTarget,
      })
      .where(eq(userProgress.userId, userId));
  } else {
    // Otherwise update all fields and then lock the profile (except dailyTarget remains changeable)
    await db
      .update(userProgress)
      .set({
        userName: newName || "Anonymous",
        userImageSrc: newImage || "/mascot_purple.svg",
        schoolId,
        dailyTarget: newDailyTarget,
        profileLocked: true,
      })
      .where(eq(userProgress.userId, userId));
  }

  // Update the "users" table as well
  const existingUserRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (existingUserRow) {
    await db
      .update(users)
      .set({
        name: newName || "User",
        avatar: newImage || "/mascot_purple.svg",
        updated_at: new Date(),
      })
      .where(eq(users.id, userId));
  } else {
    await db.insert(users).values({
      id: userId,
      email: user.email ?? "",
      name: newName || "User",
      avatar: newImage || "/mascot_purple.svg",
      provider: "email",
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  return true;
}
