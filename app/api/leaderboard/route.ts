import { NextRequest, NextResponse } from "next/server";
import { getTopUsers } from "@/db/queries";
import { checkRateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit-db";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimit({
      key: `leaderboard:ip:${ip}`,
      ...RATE_LIMITS.leaderboard,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen biraz bekleyin." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

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
