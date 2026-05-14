import { NextRequest, NextResponse } from "next/server";
import { performDailyReset, applyDailyStreakBonuses } from "@/actions/daily-streak";

import { getRequestLogger } from "@/lib/logger";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function POST(request: NextRequest) {
  const log = await getRequestLogger({ labels: { module: "cron", job: "reset-streaks" } });
  try {
    // `allowVercelCronHeader: false`: bu uç manuel tetikleme için tasarlandı,
    // Vercel Cron `daily/route` üzerinden zaten reset-streaks adımını çağırıyor.
    // Tahmin edilemez `CRON_SECRET` zorunlu — `Bearer undefined` saldırısını kapatır.
    const auth = verifyCronAuth(request, { allowVercelCronHeader: false });
    if (!auth.ok) {
      log.warn("unauthorized cron attempt", { reason: auth.reason });
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 401 }
      );
    }

    const startTime = new Date();
    log.info("daily reset started", { startedAt: startTime.toISOString() });

    const result = await performDailyReset();

    if (result.success) {
      await applyDailyStreakBonuses();
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    if (result.success) {
      log.info("daily reset completed", {
        durationMs: duration,
        summary: result.summary,
      });
      return NextResponse.json(
        {
          success: true,
          message: "Daily reset completed successfully",
          timestamp: endTime.toISOString(),
          duration: `${duration}ms`,
          summary: result.summary
        },
        { status: 200 }
      );
    } else {
      log.error({
        message: "daily reset failed",
        error: result.error,
        source: "cron",
        location: "cron/reset-streaks/performDailyReset",
        fields: { durationMs: duration },
      });
      return NextResponse.json(
        {
          success: false,
          message: "Daily reset failed",
          error: result.error,
          timestamp: endTime.toISOString(),
          duration: `${duration}ms`
        },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error({
      message: "daily streak reset threw",
      error,
      source: "cron",
      location: "cron/reset-streaks",
    });
    return NextResponse.json(
      {
        success: false,
        error: "Sunucu tarafında bir hata oluştu.",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/** Sağlık kontrolü — tetikleme yöntemi production yanıtında açıklanmaz. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  return NextResponse.json(
    {
      message: "Daily streak reset endpoint is healthy",
      timestamp: new Date().toISOString(),
      instructions: "Use POST with Bearer token to trigger reset",
    },
    { status: 200 }
  );
} 