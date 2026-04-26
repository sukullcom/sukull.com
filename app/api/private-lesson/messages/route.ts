/**
 * GET /api/private-lesson/messages
 *   List conversations for the current user (either role). Each row
 *   surfaces the other participant + last message snippet.
 */
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import { listStudentConversations } from "@/db/queries";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 },
      );
    }

    // Cap conversation-list polling per user. Legitimate clients poll
    // this when the chat drawer is open; 120/min is room for a 2s
    // interval plus user-initiated refreshes. A looser ceiling invites
    // scrapers to enumerate every unlock a user has ever received.
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

    const rows = await listStudentConversations(user.id);
    return NextResponse.json({ conversations: rows });
  } catch (error) {
    const log = await getRequestLogger({
      labels: {
        route: "api/private-lesson/messages",
        op: "list",
      },
    });
    log.error({
      message: "list conversations failed",
      error,
      location: "api/private-lesson/messages/GET",
    });
    return NextResponse.json(
      { error: "Sohbetler alınamadı" },
      { status: 500 },
    );
  }
}
