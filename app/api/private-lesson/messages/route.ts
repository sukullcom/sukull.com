/**
 * GET /api/private-lesson/messages
 *   List conversations for the current user (either role). Each row
 *   surfaces the other participant + last message snippet.
 */
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
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
