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
import { getPrivateLessonContactForPair } from "@/db/queries/private-lesson-contact";

type RouteContext = { params: { chatId: string } };

/**
 * GET — email + phone for both parties when the student–teacher pair
 * has an active `message_unlocks` row (paid message or listing offer).
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 },
      );
    }

    // Contact reveal returns PII (email + phone) after the unlock
    // check below passes. The unlock check *allows* the read forever
    // once paid, so an attacker with one legitimate unlock could
    // otherwise scrape the counterparty's contact unboundedly. Per-user
    // cap makes that pattern visible instead of silent.
    const rl = await checkRateLimit({
      key: `messagesRead:user:${user.id}`,
      ...RATE_LIMITS.messagesRead,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek. Biraz sonra tekrar deneyin." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const chatId = Number.parseInt(params.chatId, 10);
    if (!Number.isFinite(chatId) || chatId <= 0) {
      return NextResponse.json({ error: "Geçersiz sohbet" }, { status: 400 });
    }

    const chat = await db.query.studyBuddyChats.findFirst({
      where: eq(studyBuddyChats.id, chatId),
      columns: { id: true, participants: true },
    });
    if (!chat) {
      return NextResponse.json({ error: "Sohbet bulunamadı" }, { status: 404 });
    }
    const parts = chat.participants ?? [];
    if (!parts.includes(user.id)) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
    const otherId = parts.find((p) => p !== user.id);
    if (!otherId) {
      return NextResponse.json({ error: "Geçersiz katılımcı" }, { status: 400 });
    }

    const result = await getPrivateLessonContactForPair(user.id, otherId);
    if (!result.ok) {
      if (result.code === "not_unlocked") {
        return NextResponse.json(
          { error: "İletişim bilgileri bu sohbet için açık değil" },
          { status: 403 },
        );
      }
      if (result.code === "invalid_pair") {
        return NextResponse.json(
          { error: "Bu eşleşme için iletişim yok" },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ contact: result.data });
  } catch (error) {
    (await getRequestLogger({ labels: { route: "pl-messages/contact" } })).error(
      { message: "contact GET failed", error, location: "contact/GET" },
    );
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
