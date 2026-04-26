import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { activityLog } from "@/db/schema";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";

/**
 * Internal activity-log sink for DAU/WAU/MAU analytics.
 *
 * Called from the edge middleware (see `middleware.ts → maybeLogActivity`)
 * with `keepalive: true` after the user's response has already been
 * emitted, so this handler is strictly out-of-band and must NEVER
 * block on anything heavy.
 *
 * ## Why we no longer trust `userId` from the body
 *
 * The previous implementation accepted `{ userId, eventType, page }`
 * in the body and gated access with `INTERNAL_API_KEY`. That's one
 * secret guarding the analytics table: if the key ever leaks (build
 * log, CI artifact, developer machine, etc.) an attacker can mint
 * arbitrary `page_view` rows for any `userId` they know, silently
 * poisoning DAU / retention metrics and the admin analytics UI.
 *
 * The fix is to stop taking `userId` from the caller at all. The
 * middleware forwards the request's `Cookie` header, and this handler
 * re-derives the user via `getServerUser()` — the same cryptographic
 * check every other server route does. Now forging a page view
 * requires **both** the internal key and a valid Supabase session
 * cookie for the target user, which means in practice the attacker
 * can only log events for accounts they already control — which is
 * uninteresting.
 *
 * The `INTERNAL_API_KEY` check stays as a cheap first-line filter:
 * it keeps unauthenticated traffic (health-check probes, random
 * pentest scanners) from even touching `getServerUser()` or the DB.
 */
export async function POST(req: NextRequest) {
  const log = await getRequestLogger({ labels: { route: "api/activity-log" } });
  try {
    const authHeader = req.headers.get("x-internal-key");
    if (authHeader !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const user = await getServerUser();
    if (!user) {
      // Middleware called us without a valid session cookie — could
      // happen briefly during sign-out races, or if the cookie is
      // forwarded stripped by an unusual proxy. Nothing to log; don't
      // 500 the detached fetch.
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { eventType, page, metadata } = (await req.json()) as {
      eventType?: string;
      page?: string;
      metadata?: unknown;
    };

    if (!eventType) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    await db.insert(activityLog).values({
      userId: user.id,
      eventType,
      page: page || null,
      metadata: (metadata as Record<string, unknown>) ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error({
      message: "activity-log insert failed",
      error,
      source: "api-route",
      location: "api/activity-log",
    });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
