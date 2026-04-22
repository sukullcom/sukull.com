import db from "@/db/drizzle";
import { errorLog } from "@/db/schema";

/**
 * Lightweight, Postgres-backed error logger.
 *
 * Writes to the `error_log` table (migration 0023). Never throws — logging
 * failures are swallowed so they cannot take down the caller. Daily cron
 * prunes rows older than 30 days via `cleanup_error_log()`.
 *
 * Use this from server actions, API routes, middleware and cron jobs.
 * Client-side errors should POST to `/api/errors` which forwards here.
 */

export type ErrorSource =
  | "server-action"
  | "api-route"
  | "client"
  | "middleware"
  | "cron"
  | "payment";

export type ErrorLevel = "error" | "warn" | "fatal";

export interface LogErrorOptions {
  source: ErrorSource;
  error: unknown;
  location?: string;
  level?: ErrorLevel;
  userId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
  userAgent?: string | null;
  url?: string | null;
}

function extractMessage(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message || error.name, stack: error.stack };
  }
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error).slice(0, 2000) };
  } catch {
    return { message: "Unknown error (unserializable)" };
  }
}

export async function logError(opts: LogErrorOptions): Promise<void> {
  try {
    const { message, stack } = extractMessage(opts.error);
    await db.insert(errorLog).values({
      source: opts.source,
      location: opts.location ?? null,
      level: opts.level ?? "error",
      message: message.slice(0, 4000),
      stack: stack ? stack.slice(0, 8000) : null,
      userId: opts.userId ?? null,
      requestId: opts.requestId ?? null,
      metadata: opts.metadata ?? null,
      userAgent: opts.userAgent ?? null,
      url: opts.url ?? null,
    });
  } catch (dbError) {
    console.error("[error-logger] failed to persist error:", dbError);
    console.error("[error-logger] original error:", opts.error);
  }
}

/**
 * Fire-and-forget variant: schedules the log write without awaiting.
 * Use this from hot paths (middleware, request handlers) where the caller
 * should not pay the DB round-trip latency.
 */
export function logErrorAsync(opts: LogErrorOptions): void {
  void logError(opts).catch(() => {
    // already handled inside logError
  });
}
