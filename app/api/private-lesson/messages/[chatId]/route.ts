/**
 * GET  /api/private-lesson/messages/[chatId]
 *   Read the message log for a study_buddy_chats thread the user
 *   participates in. Private-lesson-side UI only displays chats that
 *   have a `message_unlocks` row, but the guard here is participation
 *   in the chat itself — participants include both ends of any unlock.
 *
 * POST /api/private-lesson/messages/[chatId]
 *   Append a message to the thread. Server-side length + rate-limit
 *   checks. No credit is charged per message (the student already
 *   paid once to unlock).
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
import { studyBuddyChats, studyBuddyMessages } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { sendMessageInUnlockedThread } from "@/db/queries/messages";

type RouteContext = { params: { chatId: string } };

const MAX_MESSAGE_LENGTH = 1000;

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

    // Transcript reads return up to 500 messages per call, so an
    // unthrottled client can exfiltrate a long chat history quickly.
    // Ceiling is aligned with `messagesRead` (120/min) — 2 s realtime
    // polling plus headroom. Membership is still enforced below.
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

    const messages = await db
      .select({
        id: studyBuddyMessages.id,
        sender: studyBuddyMessages.sender,
        content: studyBuddyMessages.content,
        createdAt: studyBuddyMessages.created_at,
      })
      .from(studyBuddyMessages)
      .where(eq(studyBuddyMessages.chat_id, chatId))
      .orderBy(asc(studyBuddyMessages.created_at))
      .limit(500);

    return NextResponse.json({
      participants: chat.participants ?? [],
      messages: messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const log = await getRequestLogger({
      labels: {
        route: "api/private-lesson/messages/[chatId]",
        op: "read",
      },
    });
    log.error({
      message: "read messages failed",
      error,
      location: "api/private-lesson/messages/[chatId]/GET",
    });
    return NextResponse.json(
      { error: "Mesajlar alınamadı" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
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

    const chatId = Number.parseInt(params.chatId, 10);
    if (!Number.isFinite(chatId) || chatId <= 0) {
      return NextResponse.json({ error: "Geçersiz sohbet" }, { status: 400 });
    }

    // Mild write burst protection — actual per-pair gating already
    // happens via `message_unlocks`.
    const rl = await checkRateLimit({
      key: `writeBurst:user:${user.id}`,
      ...RATE_LIMITS.writeBurst,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok hızlı mesaj gönderiyorsunuz" },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const content =
      typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json(
        { error: "Mesaj boş olamaz" },
        { status: 400 },
      );
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir` },
        { status: 400 },
      );
    }

    try {
      const msg = await sendMessageInUnlockedThread({
        senderId: user.id,
        chatId,
        content,
      });
      return NextResponse.json({
        message: {
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          createdAt: msg.created_at.toISOString(),
        },
      });
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      if (m === "chat_not_found") {
        return NextResponse.json(
          { error: "Sohbet bulunamadı" },
          { status: 404 },
        );
      }
      if (m === "chat_forbidden") {
        return NextResponse.json(
          { error: "Bu sohbete erişim yetkiniz yok" },
          { status: 403 },
        );
      }
      throw err;
    }
  } catch (error) {
    const log = await getRequestLogger({
      labels: {
        route: "api/private-lesson/messages/[chatId]",
        op: "send",
      },
    });
    log.error({
      message: "send message failed",
      error,
      location: "api/private-lesson/messages/[chatId]/POST",
    });
    return NextResponse.json(
      { error: "Mesaj gönderilemedi" },
      { status: 500 },
    );
  }
}
