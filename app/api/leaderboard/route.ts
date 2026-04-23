import { NextRequest, NextResponse } from "next/server";
import { getTopUsers } from "@/db/queries";
import { checkRateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit-db";
import { getRequestLogger } from "@/lib/logger";

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
    const log = await getRequestLogger({ labels: { module: "leaderboard" } });
    log.error({
      message: "leaderboard GET failed",
      error,
      source: "api-route",
      location: "leaderboard/GET",
    });
    return NextResponse.json({ error: "Sunucu tarafında bir hata oluştu." }, { status: 500 });
  }
}
