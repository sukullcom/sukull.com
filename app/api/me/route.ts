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

  // Find userProgress row, including schoolId
  const row = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: {
      userName: true,
      userImageSrc: true,
      profileLocked: true,
      schoolId: true,
    },
  });

  // If no row, return defaults
  if (!row) {
    return NextResponse.json({
      userName: "Anonymous",
      userImageSrc: "/mascot_purple.svg",
      profileLocked: false,
      schoolId: null,
    });
  }

  return NextResponse.json({
    userName: row.userName,
    userImageSrc: row.userImageSrc,
    profileLocked: row.profileLocked,
    schoolId: row.schoolId,
  });
}
