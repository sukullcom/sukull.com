import { NextResponse } from "next/server";

import {
  listRecentInstagramComments,
  listRecentInstagramWebhookEvents,
} from "@/db/queries/instagram-comments";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Son Instagram yorumları. Yalnız yönetici oturumu okuyabilir. */
export async function GET() {
  const allowed = await isAdmin();
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [comments, events] = await Promise.all([
    listRecentInstagramComments(50),
    listRecentInstagramWebhookEvents(8),
  ]);
  return NextResponse.json(
    { comments, events },
    { headers: { "Cache-Control": "no-store" } },
  );
}
