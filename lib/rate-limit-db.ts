import "server-only";
import { sql } from "drizzle-orm";
import db from "@/db/drizzle";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  /** Seconds until the window resets (>= 0). */
  retryAfter: number;
};

export type RateLimitOptions = {
  /** Unique key identifying the caller + action (e.g. `login:ip:1.2.3.4`). */
  key: string;
  /** Max attempts allowed in the window. */
  max: number;
  /** Window size in seconds. */
  windowSeconds: number;
};

/**
 * Distributed rate limiter backed by the Postgres `check_rate_limit` function.
 * Atomic under concurrent requests and survives across serverless invocations.
 *
 * On DB errors this returns `{ allowed: true }` (fail-open) so that a
 * transient DB outage never locks all users out. Errors are logged.
 */
export async function checkRateLimit({
  key,
  max,
  windowSeconds,
}: RateLimitOptions): Promise<RateLimitResult> {
  try {
    const result = await db.execute(
      sql`SELECT * FROM check_rate_limit(${key}, ${max}, ${windowSeconds})`,
    );
    const row =
      // drizzle+pg returns `.rows`, drizzle+postgres-js returns array-like
      (result as unknown as { rows?: Array<Record<string, unknown>> }).rows?.[0] ??
      (result as unknown as Array<Record<string, unknown>>)[0];

    if (!row) {
      return fallbackAllow(max, windowSeconds);
    }

    const resetAt = new Date(row.reset_at as string);
    const retryAfter = Math.max(0, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
    return {
      allowed: Boolean(row.allowed),
      remaining: Number(row.remaining ?? 0),
      resetAt,
      retryAfter,
    };
  } catch (error) {
    console.error("[rate-limit-db] check_rate_limit failed:", error);
    return fallbackAllow(max, windowSeconds);
  }
}

function fallbackAllow(max: number, windowSeconds: number): RateLimitResult {
  return {
    allowed: true,
    remaining: max,
    resetAt: new Date(Date.now() + windowSeconds * 1000),
    retryAfter: windowSeconds,
  };
}

/** Extract client IP from request headers (Vercel / Cloudflare / generic). */
export function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

/**
 * Convenience: build a 429 JSON response with standard headers.
 * Import NextResponse at the call site to avoid a cross-boundary dep here.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
    "Retry-After": String(result.retryAfter),
  };
}

/**
 * Preset buckets for common auth and write-heavy endpoints.
 */
export const RATE_LIMITS = {
  // Auth — IP-scoped
  login: { max: 8, windowSeconds: 15 * 60 },
  register: { max: 5, windowSeconds: 60 * 60 },
  resetPassword: { max: 5, windowSeconds: 60 * 60 },
  resendVerification: { max: 3, windowSeconds: 15 * 60 },

  // Writes — user-scoped
  pointsAdd: { max: 120, windowSeconds: 60 },       // ~2/s per user, generous for active play
  imageUpload: { max: 10, windowSeconds: 60 * 60 }, // 10 per hour

  // Reads — user-scoped, protects DB from loops
  leaderboard: { max: 60, windowSeconds: 60 },

  // Generic write endpoints
  writeBurst: { max: 30, windowSeconds: 60 },

  // Client-side error reports — per IP, keep noise out but allow real crashes
  errorReport: { max: 30, windowSeconds: 60 },
} as const;
