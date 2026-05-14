import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logErrorAsync } from "@/lib/error-logger";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit-db";

/** Çok büyük metadata payload'ları DB'yi şişirebilir; sert üst sınır. */
const MAX_BODY_BYTES = 16 * 1024;
const MAX_MESSAGE_LEN = 2_000;
const MAX_STACK_LEN = 8_000;
const MAX_LOCATION_LEN = 200;
const MAX_URL_LEN = 1_000;
const MAX_METADATA_KEYS = 32;

/**
 * URL'lerden hassas query/hash parametrelerini siliyoruz. OAuth callback
 * hata sayfalarında (#access_token=…&refresh_token=…) ya da magic-link
 * sayfalarında token'lar window.location.href'e düşebilir; client-side
 * error reporter'ı bunları sunucu log'una taşımasın.
 */
const REDACTED_PARAM_KEYS = new Set([
  "access_token",
  "refresh_token",
  "id_token",
  "provider_token",
  "code",
  "token",
  "token_hash",
  "secret",
  "api_key",
  "apikey",
  "password",
  "otp",
]);

function sanitizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).slice(0, MAX_URL_LEN);
  try {
    const u = new URL(trimmed);
    let mutated = false;
    for (const key of Array.from(u.searchParams.keys())) {
      if (REDACTED_PARAM_KEYS.has(key.toLowerCase())) {
        u.searchParams.set(key, "[redacted]");
        mutated = true;
      }
    }
    if (u.hash && u.hash.length > 1) {
      const hashParams = new URLSearchParams(u.hash.slice(1));
      let hashMutated = false;
      for (const key of Array.from(hashParams.keys())) {
        if (REDACTED_PARAM_KEYS.has(key.toLowerCase())) {
          hashParams.set(key, "[redacted]");
          hashMutated = true;
        }
      }
      if (hashMutated) {
        u.hash = hashParams.toString();
        mutated = true;
      }
    }
    return mutated ? u.toString() : trimmed;
  } catch {
    return trimmed;
  }
}

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

    // Body'i `text()` ile alıp manuel parse: aşırı büyük JSON'ları platform
    // limitine kalmadan kendimiz kesiyoruz; ileride `sendBeacon` çağrıları
    // mb'lik yığın gönderse DB ve memory'yi korumuş oluruz.
    const rawText = await req.text().catch(() => "");
    if (rawText.length === 0) {
      return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
    }
    if (rawText.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "payload too large" }, { status: 413 });
    }
    let body: {
      message?: string;
      stack?: string;
      location?: string;
      url?: string;
      metadata?: Record<string, unknown>;
    } | null = null;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
    }

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

    const safeMetadata =
      body.metadata && typeof body.metadata === "object"
        ? Object.fromEntries(Object.entries(body.metadata).slice(0, MAX_METADATA_KEYS))
        : undefined;

    logErrorAsync({
      source: "client",
      error: Object.assign(
        new Error(String(body.message).slice(0, MAX_MESSAGE_LEN)),
        body.stack ? { stack: String(body.stack).slice(0, MAX_STACK_LEN) } : {},
      ),
      location:
        typeof body.location === "string"
          ? body.location.slice(0, MAX_LOCATION_LEN)
          : undefined,
      userId,
      url:
        sanitizeUrl(typeof body.url === "string" ? body.url : null) ??
        sanitizeUrl(req.headers.get("referer")),
      userAgent: req.headers.get("user-agent"),
      metadata: safeMetadata,
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
