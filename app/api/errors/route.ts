import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logErrorAsync } from "@/lib/error-logger";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit-db";

/**
 * Receives client-side error reports (from React error boundaries and
 * the global unhandled-rejection handler) and forwards them to the
 * Postgres-backed error logger. Unauthenticated callers are allowed
 * because errors can happen before login succeeds, but rate limiting
 * protects against noise and abuse.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit({
      key: `errors:${ip}`,
      ...RATE_LIMITS.errorReport,
    });
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, rateLimited: true }, { status: 429 });
    }

    const body = (await req.json().catch(() => null)) as
      | {
          message?: string;
          stack?: string;
          location?: string;
          url?: string;
          metadata?: Record<string, unknown>;
        }
      | null;

    if (!body || !body.message || typeof body.message !== "string") {
      return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      // unauthenticated clients can still report
    }

    logErrorAsync({
      source: "client",
      error: Object.assign(new Error(body.message), { stack: body.stack }),
      location: body.location,
      userId,
      url: body.url ?? req.headers.get("referer"),
      userAgent: req.headers.get("user-agent"),
      metadata: body.metadata,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Intentional console.error: this is the error-reporting endpoint itself
    // failing. We cannot re-enter the same pipeline (would recurse). The
    // Postgres error_log is also likely the root cause (network/DB issue),
    // so console is the safest last-resort sink.
    console.error("[api/errors] failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
