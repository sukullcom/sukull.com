import { NextResponse } from "next/server";

import { listRecentInstagramComments } from "@/db/queries/instagram-comments";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Son Instagram yorumları. Yalnız yönetici oturumu okuyabilir. */
export async function GET() {
  const allowed = await isAdmin();
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const comments = await listRecentInstagramComments(50);
  return NextResponse.json(
    { comments },
    { headers: { "Cache-Control": "no-store" } },
  );
}
