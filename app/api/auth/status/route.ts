import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getServerUser } from "@/lib/auth";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/status
 *
 * Lightweight session probe used by client layouts to decide whether
 * to show auth-gated UI. A misbehaving `useEffect` in a header menu
 * has historically fired this on every render, which — multiplied
 * across a tab left open for hours — drove non-trivial load on the
 * Supabase auth server.
 *
 * Rate-limit bucket: `lightProbe` (60/min). Scoped per-user when we
 * have a session cookie; falls back to per-IP for the unauthenticated
 * case so that an unauthenticated loop also gets capped. Without a
 * cookie the response is cheap (no DB work), so a generous IP ceiling
 * is fine here.
 */
export async function GET() {
  try {
    const user = await getServerUser();

    const rlKey = user
      ? `authStatus:user:${user.id}`
      : `authStatus:ip:${await resolveClientIp()}`;
    const rl = await checkRateLimit({
      key: rlKey,
      ...RATE_LIMITS.lightProbe,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { authenticated: !!user, timestamp: new Date().toISOString() },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    return NextResponse.json({
      authenticated: !!user,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

async function resolveClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip")?.trim() || "unknown";
}
