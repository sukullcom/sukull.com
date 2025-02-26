// actions/profile.ts
"use server";

import db from "@/db/drizzle";
import { userProgress, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
// If you no longer need "usersHelper", you can remove this import:
import { users as usersHelper } from "@/utils/users";

/**
 * Fetch profile data (user_progress) for the currently authenticated user.
 * Returns defaults if no row found.
 */
export async function getProfileDataOnServer() {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const userId = user.id;

  const row = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: {
      userName: true,
      userImageSrc: true,
      profileLocked: true,
      schoolId: true,
    },
  });

  if (!row) {
    // Return defaults if no row yet
    return {
      userName: "Anonymous",
      userImageSrc: "/mascot_purple.svg",
      profileLocked: false,
      schoolId: null,
    };
  }

  return row;
}

// 2) Fetch all schools
export async function getAllSchoolsOnServer() {
  return await db.query.schools.findMany({
    orderBy: (tbl, { asc }) => [asc(tbl.name)],
    // columns: { id: true, name: true, type: true } // or fetch whichever fields you need
  });
}

/**
 * Update profile (both in user_progress and the users table).
 * Locks the profile after the first update.
 */
export async function updateProfileAction(
  newName: string,
  newImage: string,
  schoolId: number
) {
  const user = await getServerUser();
  if (!user) throw new Error("Not authenticated");
  const userId = user.id;

  // 1) Grab existing user_progress row
  const progressRow = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });
  if (!progressRow) {
    throw new Error("No user_progress row found for this user.");
    // Or create one if you want to allow that
  }

  // If profile is locked, disallow changes
  if (progressRow.profileLocked) {
    throw new Error("Profile changes locked.");
  }

  // 2) Update user_progress
  await db
    .update(userProgress)
    .set({
      userName: newName || "Anonymous",
      userImageSrc: newImage || "/mascot_purple.svg",
      schoolId,
      profileLocked: true, // lock upon saving
    })
    .where(eq(userProgress.userId, userId));

  // 3) Also update the "users" table in Drizzle
  const existingUserRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (existingUserRow) {
    // Update existing row
    await db
      .update(users)
      .set({
        name: newName || "User",
        avatar: newImage || "/mascot_purple.svg",
        updated_at: new Date(),
      })
      .where(eq(users.id, userId));
  } else {
    // Or insert if missing
    await db.insert(users).values({
      id: userId,
      email: user.email ?? "",
      name: newName || "User",
      avatar: newImage || "/mascot_purple.svg",
      provider: "email", // or your actual provider
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // Optionally, if you still use it:
  // await usersHelper.updateUser(userId, { name: newName, avatar: newImage });

  return true;
}
