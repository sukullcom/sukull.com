// app/actions/profile.ts
"use server";

import { getServerUser } from "@/lib/auth.server";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateProfileAction(newName: string, newImage: string) {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  const userId = user.uid;

  // userProgress satırını güncelle
  await db
    .update(userProgress)
    .set({
      userName: newName || "User",
      userImageSrc: newImage || "/mascot_purple.svg",
    })
    .where(eq(userProgress.userId, userId));

  return true;
}
