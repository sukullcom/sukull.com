/**
 * POST /api/study-buddy/chats/[chatId]/notify-first
 *
 * Study-buddy mesajları RLS altında doğrudan PostgREST üzerinden eklendiği
 * için sunucu mesaj ekleme yolunu görmez. Bu uç, istemcinin ilk mesajı
 * gönderdikten sonra "haber ver" diye tetiklediği fire-and-forget bir
 * çağrıdır. Asıl güvenlik tabakası `notifyFirstMessageIfApplicable`
 * içindeki idempotency satırıdır — istemci ne kadar çağırırsa çağırsın
 * yalnızca bir e-posta gider.
 *
 * Güvenlik kontrolleri:
 *  - Auth
 *  - Same-origin + CSRF
 *  - Kullanıcı başına `messageSend` rate-limit (mevcut limitle aynı kova)
 *  - Gönderen sohbet katılımcısı mı (helper tekrar doğrular ama burada
 *    erken kapatıyoruz)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import db from "@/db/drizzle";
import { studyBuddyChats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyCsrf } from "@/lib/csrf";
import { isTrustedApiOrigin } from "@/lib/same-origin-api";
import { notifyFirstMessageIfApplicable } from "@/lib/first-message-email";

type RouteContext = { params: { chatId: string } };

const MAX_PREVIEW_LENGTH = 280;

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  const log = await getRequestLogger({
    labels: {
      route: "api/study-buddy/chats/[chatId]/notify-first",
      op: "notify",
    },
  });

  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 },
      );
    }

    const chatId = Number.parseInt(params.chatId, 10);
    if (!Number.isFinite(chatId) || chatId <= 0) {
      return NextResponse.json({ error: "Geçersiz sohbet" }, { status: 400 });
    }

    if (!isTrustedApiOrigin(request) || !verifyCsrf(request)) {
      return NextResponse.json(
        { error: "Geçersiz istek veya güvenlik doğrulaması başarısız." },
        { status: 403 },
      );
    }

    const rl = await checkRateLimit({
      key: `messageSend:user:${user.id}`,
      ...RATE_LIMITS.messageSend,
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
    const preview =
      typeof body.preview === "string"
        ? body.preview.trim().slice(0, MAX_PREVIEW_LENGTH)
        : "";

    // Katılımcılık kontrolü — yetkisiz kullanıcının başkasının sohbeti için
    // sahte tetikleme yapmasını engellemek için.
    const chat = await db.query.studyBuddyChats.findFirst({
      where: eq(studyBuddyChats.id, chatId),
      columns: { participants: true },
    });
    if (!chat) {
      return NextResponse.json(
        { error: "Sohbet bulunamadı" },
        { status: 404 },
      );
    }
    if (!(chat.participants ?? []).includes(user.id)) {
      return NextResponse.json(
        { error: "Bu sohbete erişim yetkiniz yok" },
        { status: 403 },
      );
    }

    const result = await notifyFirstMessageIfApplicable({
      chatId,
      senderId: user.id,
      messagePreview: preview,
    });

    // Sonuç ne olursa olsun istemci için "ok" — bildirim best-effort.
    return NextResponse.json({
      ok: true,
      sent: result.sent,
    });
  } catch (error) {
    log.error({
      message: "notify-first failed",
      error,
      location: "api/study-buddy/chats/[chatId]/notify-first/POST",
    });
    // Best-effort: hata da olsa kullanıcı akışını engelleme.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
