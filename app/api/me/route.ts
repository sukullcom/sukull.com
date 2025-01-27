// app/api/me/route.ts
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.uid;

  const row = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (!row) {
    // Could create or return defaults
    return NextResponse.json({
      userName: "User",
      userImageSrc: "/mascot_purple.svg",
      profileLocked: false,
    });
  }

  return NextResponse.json({
    userName: row.userName,
    userImageSrc: row.userImageSrc,
    profileLocked: row.profileLocked,
  });
}
