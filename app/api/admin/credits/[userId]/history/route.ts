/**
 * GET /api/admin/credits/[userId]/history
 *
 * Belirli kullanıcının kredi ayarlama geçmişi (son 50). UI'da seçilen
 * kullanıcı kartı açılınca yüklenir.
 */
import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { creditAdjustments } from "@/db/schema";
import { getAdminActor } from "@/lib/admin";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";

type RouteContext = { params: { userId: string } };

const HISTORY_LIMIT = 50;

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const log = await getRequestLogger({
    labels: { route: "api/admin/credits/[userId]/history", op: "history" },
  });

  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 401 },
      );
    }

    const rl = await checkRateLimit({
      key: `adminCreditsSearch:user:${actor.id}`,
      ...RATE_LIMITS.adminCreditsSearch,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const userId = (params.userId ?? "").trim();
    if (!userId) {
      return NextResponse.json(
        { error: "Kullanıcı kimliği gerekli." },
        { status: 400 },
      );
    }

    const rows = await db
      .select({
        id: creditAdjustments.id,
        delta: creditAdjustments.delta,
        reason: creditAdjustments.reason,
        balanceAfter: creditAdjustments.balanceAfter,
        adminId: creditAdjustments.adminId,
        adminEmail: creditAdjustments.adminEmail,
        createdAt: creditAdjustments.createdAt,
      })
      .from(creditAdjustments)
      .where(eq(creditAdjustments.userId, userId))
      .orderBy(desc(creditAdjustments.createdAt))
      .limit(HISTORY_LIMIT);

    return NextResponse.json({
      history: rows.map((r) => ({
        id: Number(r.id),
        delta: r.delta,
        reason: r.reason,
        balanceAfter: r.balanceAfter,
        adminEmail: r.adminEmail,
        adminId: r.adminId,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    log.error({
      message: "admin credits history failed",
      error,
      location: "api/admin/credits/[userId]/history/GET",
    });
    return NextResponse.json(
      { error: "Geçmiş yüklenemedi." },
      { status: 500 },
    );
  }
}
