"use server";

import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { adminAuth } from "@/lib/firebaseAdmin"; // for admin SDK
import { getFirestore } from "firebase-admin/firestore"; // for Firestore admin

export async function updateProfileAction(
  newName: string,
  newImage: string,
  schoolId: number
) {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  const userId = user.uid;

  const row = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });
  if (!row) {
    throw new Error("No userProgress found");
  }
  if (row.profileLocked) {
    throw new Error("Profile changes locked.");
  }

  // 1) Update Drizzle
  await db
    .update(userProgress)
    .set({
      userName: newName || "Anonymous",
      userImageSrc: newImage || "/mascot_purple.svg",
      schoolId,
      profileLocked: true,
    })
    .where(eq(userProgress.userId, userId));

  // 2) Update Firebase Auth displayName (OPTIONAL photo)
  // If you do not want the user’s firebase Auth photoURL overwritten, just comment out:
  await adminAuth.updateUser(userId, {
    displayName: newName || "Anonymous",
    // photoURL: newImage, // <--- comment out to avoid overwriting with Google link
  });

  // 3) Mirror to Firestore
  const firestore = getFirestore();
  await firestore.collection("users").doc(userId).set(
    {
      userName: newName || "Anonymous",
      userImageSrc: newImage || "/mascot_purple.svg",
      schoolId,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return true;
}
