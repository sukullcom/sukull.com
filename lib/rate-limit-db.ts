import "server-only";
import { sql } from "drizzle-orm";
import db from "@/db/drizzle";
import { logger } from "@/lib/logger";

const log = logger.child({ labels: { module: "rate-limit-db" } });

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
  /**
   * What to do when the backing store is unavailable (DB down, pool
   * exhausted, etc). Defaults to `"open"` so that a 60-second Postgres
   * blip does not lock every logged-in user out.
   *
   * Set to `"closed"` on endpoints where the cost of an unbounded
   * request flood outweighs the availability hit — in practice that
   * means money flows (payments, credit spend) and destructive writes
   * (account deletion). On those paths, returning 503 during a DB
   * outage is strictly safer than accepting the write.
   */
  onStoreError?: "open" | "closed";
};

/**
 * Distributed rate limiter backed by the Postgres `check_rate_limit` function.
 * Atomic under concurrent requests and survives across serverless invocations.
 *
 * On DB errors this returns `{ allowed: true }` by default (fail-open)
 * so a transient DB outage never locks all users out. Callers that
 * guard money flows or destructive actions can opt into fail-closed
 * via `onStoreError: "closed"`. Errors are always logged.
 */
export async function checkRateLimit({
  key,
  max,
  windowSeconds,
  onStoreError = "open",
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
      return onStoreError === "closed"
        ? fallbackDeny(windowSeconds)
        : fallbackAllow(max, windowSeconds);
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
    log.error({
      message: "check_rate_limit failed",
      error,
      source: "middleware",
      location: "rate-limit-db/checkRateLimit",
      fields: { key, max, windowSeconds, onStoreError },
    });
    return onStoreError === "closed"
      ? fallbackDeny(windowSeconds)
      : fallbackAllow(max, windowSeconds);
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

/**
 * Used only when `onStoreError: "closed"` is set and the limiter
 * backing store is unreachable. Callers see a 429-shaped result and
 * are told to retry after the full window, which is the safest
 * behaviour for destructive / money-moving endpoints.
 */
function fallbackDeny(windowSeconds: number): RateLimitResult {
  return {
    allowed: false,
    remaining: 0,
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
 *
 * Naming convention:
 *   • Verbs for writes (booking, snippet, review)
 *   • Plural nouns for reads (schools, teachers)
 *
 * Budget philosophy:
 *   • Auth buckets are narrow (brute-force protection, not UX)
 *   • User writes are generous enough for power users but cap abuse
 *   • Public reads are generous (cache does most of the work) but not infinite
 */
export const RATE_LIMITS = {
  // --- Auth — IP-scoped ---
  login: { max: 8, windowSeconds: 15 * 60 },
  register: { max: 5, windowSeconds: 60 * 60 },
  resetPassword: { max: 5, windowSeconds: 60 * 60 },
  resendVerification: { max: 3, windowSeconds: 15 * 60 },

  // --- Writes — user-scoped ---
  pointsAdd: { max: 120, windowSeconds: 60 },       // ~2/s per user, generous for active play
  imageUpload: { max: 10, windowSeconds: 60 * 60 }, // 10 per hour
  /** Creating or editing a code snippet. Internal "max 3 total" still applies. */
  snippetWrite: { max: 20, windowSeconds: 60 * 60 },
  /** Teacher application submission. */
  applicationSubmit: { max: 5, windowSeconds: 60 * 60 },
  /** Student listing creation / edit. */
  listingWrite: { max: 20, windowSeconds: 60 * 60 },
  /** Teacher offering on a student listing. Money-adjacent (kredi düşer). */
  listingOffer: { max: 30, windowSeconds: 60 * 60 },
  /**
   * Student spending a credit to open a chat with a teacher. Abuse
   * here would spam the teacher side; keep conservative.
   */
  messageUnlock: { max: 20, windowSeconds: 60 * 60 },
  /**
   * Account deletion (GDPR / KVKK right-to-be-forgotten).
   *
   * Destructive and irreversible — we cap at 3 attempts per 24h so a
   * rogue client-side handler can't keep hammering the endpoint while
   * the first call is still tearing down cascades. A genuine user
   * needs exactly one successful call.
   */
  accountDelete: { max: 3, windowSeconds: 24 * 60 * 60 },

  // --- Reads — user-scoped ---
  leaderboard: { max: 60, windowSeconds: 60 },
  /** Per-teacher detail page. */
  teacherDetails: { max: 60, windowSeconds: 60 },
  /** Generic authenticated read bucket when no specific preset fits. */
  read: { max: 120, windowSeconds: 60 },
  /**
   * Marketplace listing reads (list, detail, offers).
   *
   * These GETs hit uncached joins across `private_lesson_listings`,
   * `private_lesson_offers`, and the teacher profile table. At 10k MAU
   * an unthrottled POSTMan loop can easily drive the slow-query shelf
   * above its p99 budget. 90/min is generous for a legitimate user
   * flipping between filters but caps scrapers.
   */
  listingsRead: { max: 90, windowSeconds: 60 },
  /**
   * Message / chat reads (conversation list, transcript, contact reveal).
   *
   * The `[chatId]` transcript endpoint pulls up to 500 rows per call,
   * and the contact-reveal endpoint returns PII after unlock — both
   * warrant a per-user ceiling even behind membership checks. 120/min
   * supports legitimate realtime polling (every ~2 s) but rejects the
   * "scrape every chat I was ever added to" pattern.
   */
  messagesRead: { max: 120, windowSeconds: 60 },
  /**
   * Consolidated `/api/user?action=…` reader.
   *
   * Clients poll this for credits + progress + streak changes after
   * mutations. We keep it generous (3/s sustained) but bounded so a
   * runaway useEffect can't pin a single user's connection slot.
   */
  userApiRead: { max: 180, windowSeconds: 60 },
  /**
   * Lightweight per-user probes that get called on every login or
   * navigation (streak continuity check, "do I have a teacher
   * application?" lookup). They're not expensive individually but a
   * client-side loop could make them the cheapest way to DoS the
   * transaction pooler. 60/min is ~10× the realistic rate.
   */
  lightProbe: { max: 60, windowSeconds: 60 },

  // --- Public reads — IP-scoped ---
  /** Schools search/cities/districts/categories. Heavy GROUP BY aggregations. */
  schoolsRead: { max: 60, windowSeconds: 60 },
  /** Random avatar generation — cheap but trivially loopable. */
  avatar: { max: 120, windowSeconds: 60 },

  // --- Generic write endpoints ---
  writeBurst: { max: 30, windowSeconds: 60 },

  // --- Client-side error reports — per IP, keep noise out but allow real crashes ---
  errorReport: { max: 30, windowSeconds: 60 },
} as const;
