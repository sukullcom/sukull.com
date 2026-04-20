import { NextRequest, NextResponse } from "next/server";
import { getTopUsers } from "@/db/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const users = await getTopUsers(limit, offset);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: "Sunucu tarafında bir hata oluştu." }, { status: 500 });
  }
}
