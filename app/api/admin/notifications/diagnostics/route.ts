/**
 * GET  /api/admin/notifications/diagnostics
 *   Bildirim altyapısının tanı bilgilerini döner:
 *    - Resend env'leri set mi?
 *    - `chat_first_message_notifications` tablosu var mı, kaç satır?
 *    - Son N "ilk mesaj e-postası" kaydı + alıcı e-postası durumu
 *    - Son N `error_log` satırı (location = first-message-email/…)
 *
 * POST /api/admin/notifications/diagnostics
 *   { mode: "test-email", to?: string }
 *   Adminin kendi adresine veya verdiği bir adrese Resend ile test e-postası
 *   gönderir. `to` verilmezse adminin auth e-postası kullanılır.
 *
 * Tüm uçlar `isAdmin()` gate'inin arkasında.
 */
import { NextRequest, NextResponse } from "next/server";
import { desc, eq, ilike, sql } from "drizzle-orm";

import db from "@/db/drizzle";
import {
  chatFirstMessageNotifications,
  errorLog,
  users,
} from "@/db/schema";
import { getAdminActor } from "@/lib/admin";
import { logAdminActionAsync } from "@/lib/admin-audit";
import { verifyCsrf } from "@/lib/csrf";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import { isTrustedApiOrigin } from "@/lib/same-origin-api";
import {
  escapeHtml,
  sendEmailViaResend,
} from "@/lib/transactional-email-resend";

const RECENT_LIMIT = 15;

export async function GET() {
  const log = await getRequestLogger({
    labels: { route: "api/admin/notifications/diagnostics", op: "GET" },
  });

  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 401 },
      );
    }

    const resendConfigured = Boolean(
      process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim(),
    );

    let tableExists = true;
    let totalNotifications = 0;
    let recentNotifications: Array<{
      chatId: number;
      senderId: string;
      recipientId: string;
      recipientEmail: string | null;
      recipientName: string | null;
      context: string;
      notifiedAt: string;
    }> = [];

    try {
      const totalRow = await db
        .select({ value: sql<number>`count(*)::int` })
        .from(chatFirstMessageNotifications);
      totalNotifications = totalRow[0]?.value ?? 0;

      const recent = await db
        .select({
          chatId: chatFirstMessageNotifications.chatId,
          senderId: chatFirstMessageNotifications.senderId,
          recipientId: chatFirstMessageNotifications.recipientId,
          context: chatFirstMessageNotifications.context,
          notifiedAt: chatFirstMessageNotifications.notifiedAt,
          recipientEmail: users.email,
          recipientName: users.name,
        })
        .from(chatFirstMessageNotifications)
        .leftJoin(
          users,
          eq(users.id, chatFirstMessageNotifications.recipientId),
        )
        .orderBy(desc(chatFirstMessageNotifications.notifiedAt))
        .limit(RECENT_LIMIT);

      recentNotifications = recent.map((r) => ({
        chatId: r.chatId,
        senderId: r.senderId,
        recipientId: r.recipientId,
        recipientEmail: r.recipientEmail,
        recipientName: r.recipientName,
        context: r.context,
        notifiedAt: r.notifiedAt.toISOString(),
      }));
    } catch (err) {
      // En olası kök sebep: migration 0050 üretime uygulanmamış.
      tableExists = false;
      log.warn(
        "chat_first_message_notifications tablosu okunamadı (migration eksik olabilir)",
        {
          error:
            err instanceof Error
              ? { name: err.name, message: err.message }
              : { raw: String(err) },
        },
      );
    }

    const recentErrors = await db
      .select({
        id: errorLog.id,
        createdAt: errorLog.createdAt,
        level: errorLog.level,
        source: errorLog.source,
        location: errorLog.location,
        message: errorLog.message,
      })
      .from(errorLog)
      .where(ilike(errorLog.location, "first-message-email/%"))
      .orderBy(desc(errorLog.createdAt))
      .limit(RECENT_LIMIT)
      .catch(() => []);

    return NextResponse.json({
      resend: {
        configured: resendConfigured,
        hasApiKey: Boolean(process.env.RESEND_API_KEY?.trim()),
        hasFrom: Boolean(process.env.RESEND_FROM?.trim()),
        // Tam anahtarı asla göstermiyoruz; sadece "var/yok"
        from: process.env.RESEND_FROM?.trim() ?? null,
      },
      notificationsTable: {
        exists: tableExists,
        total: totalNotifications,
        recent: recentNotifications,
      },
      recentErrors: recentErrors.map((r) => ({
        id: Number(r.id),
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : new Date(r.createdAt as unknown as string).toISOString(),
        level: r.level,
        source: r.source,
        location: r.location,
        message: r.message,
      })),
    });
  } catch (error) {
    log.error({
      message: "notifications diagnostics GET failed",
      error,
      location: "api/admin/notifications/diagnostics/GET",
    });
    return NextResponse.json(
      { error: "Tanı bilgisi alınamadı." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const log = await getRequestLogger({
    labels: { route: "api/admin/notifications/diagnostics", op: "POST" },
  });

  try {
    const actor = await getAdminActor();
    if (!actor) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 401 },
      );
    }

    if (!isTrustedApiOrigin(request) || !verifyCsrf(request)) {
      return NextResponse.json(
        { error: "Geçersiz istek veya güvenlik doğrulaması başarısız." },
        { status: 403 },
      );
    }

    // Test e-postası abuse'u önlemek için adminCreditsGrant ile aynı sıkı
    // kovayı paylaşır (dakikada 30 – manuel admin işlemleri için yeterli).
    const rl = await checkRateLimit({
      key: `adminCreditsGrant:user:${actor.id}`,
      ...RATE_LIMITS.adminCreditsGrant,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const mode = typeof body.mode === "string" ? body.mode : "";
    if (mode !== "test-email") {
      return NextResponse.json(
        { error: "Geçersiz mod." },
        { status: 400 },
      );
    }

    const toRaw = typeof body.to === "string" ? body.to.trim() : "";
    let to = toRaw;
    if (!to) {
      // Adminin auth e-postasını al
      if (!actor.email) {
        return NextResponse.json(
          {
            error:
              "Adminin auth e-postası yok; lütfen 'Alıcı' alanına bir e-posta girin.",
          },
          { status: 400 },
        );
      }
      to = actor.email;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { error: "Geçersiz e-posta." },
        { status: 400 },
      );
    }

    const subject = "Sukull — bildirim tanı testi";
    const html = `
      <p>Merhaba,</p>
      <p>Bu, Sukull admin panelinden gönderilmiş bir <strong>Resend yapılandırma testidir</strong>.</p>
      <p>Bu e-postayı görüyorsanız <code>RESEND_API_KEY</code> ve <code>RESEND_FROM</code> doğru yapılandırılmıştır.</p>
      <p style="color:#64748b;font-size:12px;">Gönderen: ${escapeHtml(actor.email ?? actor.id)}</p>
    `.trim();

    const ok = await sendEmailViaResend({ to, subject, html });

    logAdminActionAsync({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "admin.other",
      targetType: "notifications.test-email",
      targetId: to,
      metadata: { ok },
    });

    if (!ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Resend gönderimi başarısız. RESEND_API_KEY / RESEND_FROM doğru mu? error_log'a ayrıntı yazıldı.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, to });
  } catch (error) {
    log.error({
      message: "notifications diagnostics POST failed",
      error,
      location: "api/admin/notifications/diagnostics/POST",
    });
    return NextResponse.json(
      { error: "Test gönderilemedi." },
      { status: 500 },
    );
  }
}
