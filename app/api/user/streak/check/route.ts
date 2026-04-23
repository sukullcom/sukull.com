import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { checkStreakContinuity } from "@/actions/daily-streak";

/**
 * POST /api/user/streak/check
 * Checks if user's streak should be reset due to missed days
 * Called when user logs in or becomes active
 */
export async function POST() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
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

