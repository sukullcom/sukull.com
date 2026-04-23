import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import db from "@/db/drizzle";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
// Health must reflect *current* infrastructure state, never a cached result —
// uptime monitors depend on this endpoint producing a fresh DB round-trip.
export const dynamic = "force-dynamic";
// Keep the handler quick; if the DB is unreachable we prefer to fail fast
// rather than tie up a function invocation for the full HTTP timeout.
export const maxDuration = 10;

const log = logger.child({ labels: { module: "api/health" } });

/**
 * GET /api/health
 *
 * Lightweight readiness probe for external uptime monitors (UptimeRobot,
 * BetterUptime, Vercel integrations) and for internal alerting.
 *
 * Intentionally does NOT hit Supabase Auth — exercising the same path on
 * every ping would count against our Auth quota and duplicate what the
 * database ping already tells us. We only verify:
 *
 *   1. The Node runtime is alive (the handler ran at all).
 *   2. The primary Postgres connection is live (a `SELECT 1` completes
 *      inside the transaction pool within the maxDuration).
 *
 * Response shape is intentionally minimal and stable — monitors parse the
 * `status` string and the HTTP code. Extra diagnostics live under
 * `checks.*` so adding a new probe does not break existing integrations.
 *
 * Returns:
 *   - `200 OK` with `{ status: "ok", checks.db: "ok" }` when healthy
 *   - `503` with `{ status: "degraded", checks.db: "error" }` when DB fails
 */
export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbLatencyMs: number | null = null;

  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    dbOk = true;
  } catch (error) {
    // Do not leak the raw error message to the wire — uptime monitors store
    // response bodies and we don't want a DB URL fragment to end up in a
    // third-party dashboard. Persist to error_log instead.
    log.error({
      message: "health check: db ping failed",
      error,
      source: "api-route",
      location: "api/health",
    });
  } finally {
    dbLatencyMs = Date.now() - dbStart;
  }

  const body = {
    status: dbOk ? "ok" : "degraded",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    environment: process.env.NODE_ENV ?? "unknown",
    region: process.env.VERCEL_REGION ?? null,
    checks: {
      db: dbOk ? "ok" : "error",
      dbLatencyMs,
    },
    elapsedMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: dbOk ? 200 : 503,
    headers: {
      // Uptime pings must never be served from cache.
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
    },
  });
}
