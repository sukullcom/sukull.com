import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "No userId" }, { status: 400 });
  }

  // Lookup in Drizzle
  const row = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
    columns: {
      userName: true,
    },
  });

  if (!row) {
    return NextResponse.json({ userName: "Unknown" }, { status: 200 });
  }

  return NextResponse.json({ userName: row.userName });
}
