// app/api/me/route.ts
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth.server";
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
    columns: {
      userName: true,
      userImageSrc: true,
    },
  });

  if (!row) {
    // Kaydı yoksa da varsayılan dönebiliriz
    return NextResponse.json({
      userName: "User",
      userImageSrc: "/mascot_purple.svg",
    });
  }

  return NextResponse.json(row);
}
