import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { activityLog } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-internal-key");
    if (authHeader !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { userId, eventType, page, metadata } = await req.json();

    if (!userId || !eventType) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    await db.insert(activityLog).values({
      userId,
      eventType,
      page: page || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
