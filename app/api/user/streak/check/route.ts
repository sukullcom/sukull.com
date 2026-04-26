import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { checkStreakContinuity } from "@/actions/daily-streak";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";

/**
 * POST /api/user/streak/check
 * Checks if user's streak should be reset due to missed days
 * Called when user logs in or becomes active
 *
 * Rate-limited on the `lightProbe` bucket: a misbehaving client-side
 * effect (e.g. a `useEffect` with a missing dependency) historically
 * fires this on every render. 60/min is ~10× the legitimate rate and
 * caps the damage to a single user without penalising normal traffic.
 */
export async function POST() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const rl = await checkRateLimit({
      key: `streakCheck:user:${user.id}`,
      ...RATE_LIMITS.lightProbe,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek. Biraz sonra tekrar deneyin." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    // Check if streak should be reset
    const wasReset = await checkStreakContinuity(user.id);

    return NextResponse.json({ 
      success: true,
      streakReset: wasReset,
      userId: user.id 
    });
  } catch (error) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { route: "api/user/streak/check" } }))
      .error({ message: "streak continuity check failed", error, location: "api/user/streak/check" });
    return NextResponse.json(
      { error: "İstikrar bilgisi kontrol edilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

