/**
 * Structured, env-aware server logger.
 *
 * ## Why a dedicated logger?
 * Prior to this module the codebase had ~120 call sites using raw
 * `console.error` / `console.log` scattered across API routes, server
 * actions and cron jobs. Vercel's function logs expire after ~24h and
 * cannot be queried, so those messages were effectively invisible in
 * production. Meanwhile `logError()` (see `error-logger.ts`) was used in
 * only ~9 places — we had a DB sink, but no convenient API to reach it.
 *
 * This logger is the missing convenience layer:
 *   - Leveled: `debug` / `info` / `warn` / `error`.
 *   - Env-aware formatting: pretty multi-line in development; single-line
 *     JSON in production so log drains and `jq` can ingest it.
 *   - `error()` **always** persists to the `error_log` Postgres table via
 *     `logErrorAsync` (non-blocking). Alerts and analytics can then be
 *     built on SQL queries against that table.
 *   - Request correlation via `getRequestLogger()` which reads
 *     `x-request-id` / `x-user-id` from Next's `headers()`. The middleware
 *     injects those headers; see `middleware.ts`.
 *
 * ## Usage
 *   - Call-site with no request context (cron, module init):
 *     ```ts
 *     logger.info("cron: daily started");
 *     logger.error({ message: "cron failed", error: e, source: "cron", location: "cron/daily" });
 *     ```
 *   - Request-scoped (server action, API route, server component):
 *     ```ts
 *     const log = await getRequestLogger();
 *     log.info("booked lesson", { teacherId });
 *     log.error({ message: "book failed", error, source: "api-route", location: "book-lesson" });
 *     ```
 *
 * ## Cost at 10K MAU
 *   - `info` / `debug` / `warn`: zero DB cost (stdout only).
 *   - `error`: exactly one INSERT into `error_log` (fire-and-forget).
 *     `cleanup_error_log()` cron prunes rows >30 days daily.
 *   - No external SaaS dependency, no per-event fee.
 *
 * ## Non-goals
 *   - Not a metrics system (no counters/histograms). Use SQL aggregates
 *     over `error_log` + `activity_log` for dashboards.
 *   - Not a tracing system. Request correlation is coarse (one id per
 *     request); downstream spans are out of scope.
 *   - Not for client-side logging. See `lib/client-logger.ts`.
 */

import { headers } from "next/headers";

import { logErrorAsync, type ErrorSource } from "./error-logger";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const IS_PROD = process.env.NODE_ENV === "production";
const IS_TEST = process.env.NODE_ENV === "test";

function resolveMinLevel(): LogLevel {
  const explicit = (process.env.LOG_LEVEL || "").toLowerCase() as LogLevel;
  if (explicit in LEVEL_ORDER) return explicit;
  if (IS_TEST) return "warn";
  return IS_PROD ? "info" : "debug";
}

const MIN_LEVEL: LogLevel = resolveMinLevel();

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}

type Bindings = {
  requestId?: string;
  userId?: string;
  /**
   * Free-form labels added to every log line from this logger instance.
   * Useful for `logger.child({ module: "booking" })` style scoping.
   */
  labels?: LogFields;
  /**
   * Default source used by `error()` when the call-site does not specify one.
   * `getRequestLogger({ labels: { route: "..." }})` and
   * `logger.child({ labels: { module: "cron/..." }})` both pick a reasonable
   * default from the labels so most call-sites can simply do
   * `log.error({ message, error, location })` without repeating themselves.
   */
  defaultSource?: ErrorSource;
};

/**
 * Infer the most appropriate `ErrorSource` from the free-form labels bound to
 * a logger. Kept intentionally conservative: unknown label shapes fall through
 * to `server-action`, which is the largest bucket of call-sites today.
 */
function inferSourceFromLabels(labels?: LogFields): ErrorSource | undefined {
  if (!labels) return undefined;
  const route = typeof labels.route === "string" ? labels.route : undefined;
  const mod = typeof labels.module === "string" ? labels.module : undefined;
  const scope = route ?? mod ?? "";
  if (!scope) return undefined;
  if (scope.startsWith("api/") || scope.includes("/api/")) {
    if (scope.includes("cron/")) return "cron";
    return "api-route";
  }
  if (scope.startsWith("cron/") || scope.includes("/cron/")) return "cron";
  if (scope.startsWith("middleware")) return "middleware";
  return undefined;
}

type EmitPayload = {
  level: LogLevel;
  message: string;
  bindings: Bindings;
  fields?: LogFields;
};

function serializeError(err: unknown): LogFields | undefined {
  if (err === undefined || err === null) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      // Stack is emitted only in dev or when explicitly in error-level JSON;
      // in prod the DB copy (via logErrorAsync) carries the full stack.
      ...(IS_PROD ? {} : { stack: err.stack }),
    };
  }
  if (typeof err === "string") return { message: err };
  try {
    return { raw: JSON.parse(JSON.stringify(err)) as unknown };
  } catch {
    return { raw: String(err) };
  }
}

function emit({ level, message, bindings, fields }: EmitPayload): void {
  if (!shouldLog(level)) return;

  const record: Record<string, unknown> = {
    level,
    message,
    time: new Date().toISOString(),
    ...(bindings.requestId ? { rid: bindings.requestId } : {}),
    ...(bindings.userId ? { uid: bindings.userId } : {}),
    ...(bindings.labels ?? {}),
    ...(fields ?? {}),
  };

  if (IS_PROD) {
    // Single-line JSON; Vercel/DigitalOcean/self-hosted log drains can ingest.
    const line = safeStringify(record);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
    return;
  }

  // Development / test: human-readable.
  const tag = { debug: "DBG", info: "INF", warn: "WRN", error: "ERR" }[level];
  const rid = bindings.requestId ? ` rid=${bindings.requestId.slice(0, 8)}` : "";
  const uid = bindings.userId ? ` uid=${bindings.userId.slice(0, 8)}` : "";
  const extras = { ...(bindings.labels ?? {}), ...(fields ?? {}) };
  const extrasStr = Object.keys(extras).length > 0 ? " " + safeStringify(extras) : "";
  const line = `[${tag}]${rid}${uid} ${message}${extrasStr}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (level === "debug") console.debug(line);
  else console.log(line);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    try {
      const seen = new WeakSet<object>();
      return JSON.stringify(value, (_k, v) => {
        if (typeof v === "object" && v !== null) {
          if (seen.has(v as object)) return "[Circular]";
          seen.add(v as object);
        }
        if (typeof v === "bigint") return v.toString();
        return v;
      });
    } catch {
      return '"[unserializable]"';
    }
  }
}

/**
 * Options for `logger.error(...)`. Unlike `info`/`warn`, error also
 * persists to the DB-backed `error_log` table so it can be queried and
 * aggregated after the fact.
 */
export type LogErrorArgs = {
  /** Short human-readable summary. Required. */
  message: string;
  /**
   * The originating error (Error instance, string, or unknown). Stack is
   * extracted automatically when it's an Error; nothing is thrown if the
   * value is not serializable.
   */
  error?: unknown;
  /**
   * Where the error originated. Mirrors the `error_log.source` column so
   * SQL filters (`WHERE source = 'api-route'`) line up with call sites.
   * Optional: if omitted, the logger infers it from its bound labels
   * (`route: "api/..."` → `api-route`, `module: "cron/..."` → `cron`, etc.)
   * and falls back to `server-action`, the largest bucket.
   */
  source?: ErrorSource;
  /**
   * Free-form location identifier: a route path, server-action name,
   * file:function, etc. Keep short; a few tokens is plenty.
   */
  location?: string;
  /**
   * Explicit user id. Prefer binding once via `getRequestLogger()`;
   * this overrides the bound value when provided.
   */
  userId?: string | null;
  /** Explicit request id; same override rules as userId. */
  requestId?: string | null;
  /** Extra structured fields. Stored in `error_log.metadata` (jsonb). */
  fields?: LogFields;
};

export interface Logger {
  readonly level: LogLevel;
  debug: (message: string, fields?: LogFields) => void;
  info: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
  /**
   * Emit an error log line AND persist to `error_log`. Never throws.
   */
  error: (args: LogErrorArgs) => void;
  /**
   * Returns a new logger with the supplied bindings merged on top of the
   * current ones. Useful at module scope:
   *   `const log = logger.child({ labels: { module: "booking" } });`
   */
  child: (extra: Bindings) => Logger;
}

function buildLogger(bindings: Bindings): Logger {
  return {
    get level() {
      return MIN_LEVEL;
    },
    debug(message, fields) {
      emit({ level: "debug", message, bindings, fields });
    },
    info(message, fields) {
      emit({ level: "info", message, bindings, fields });
    },
    warn(message, fields) {
      emit({ level: "warn", message, bindings, fields });
    },
    error(args) {
      const resolvedSource: ErrorSource =
        args.source ?? bindings.defaultSource ?? "server-action";
      const errorFields: LogFields = {
        ...(args.fields ?? {}),
        ...(args.error !== undefined ? { error: serializeError(args.error) } : {}),
        source: resolvedSource,
        ...(args.location ? { location: args.location } : {}),
      };
      emit({
        level: "error",
        message: args.message,
        bindings,
        fields: errorFields,
      });
      logErrorAsync({
        source: resolvedSource,
        error: args.error ?? args.message,
        location: args.location,
        level: "error",
        userId: args.userId ?? bindings.userId ?? null,
        requestId: args.requestId ?? bindings.requestId ?? null,
        metadata: {
          ...(bindings.labels ?? {}),
          ...(args.fields ?? {}),
        },
      });
    },
    child(extra) {
      const mergedLabels: LogFields = {
        ...(bindings.labels ?? {}),
        ...(extra.labels ?? {}),
      };
      return buildLogger({
        requestId: extra.requestId ?? bindings.requestId,
        userId: extra.userId ?? bindings.userId,
        labels: mergedLabels,
        defaultSource:
          extra.defaultSource ??
          inferSourceFromLabels(mergedLabels) ??
          bindings.defaultSource,
      });
    },
  };
}

/**
 * Default, context-free logger. Prefer `getRequestLogger()` inside a
 * request scope so log lines carry `rid`/`uid` correlation.
 */
export const logger: Logger = buildLogger({});

/**
 * Returns a request-correlated logger. Reads `x-request-id` and
 * `x-user-id` from Next's request headers (populated by `middleware.ts`).
 *
 * Safe to call outside a request scope: `headers()` throws there, we
 * catch it and return the base `logger` unchanged.
 */
export async function getRequestLogger(extra?: {
  userId?: string | null;
  labels?: LogFields;
}): Promise<Logger> {
  let requestId: string | undefined;
  let userId: string | undefined;

  try {
    const h = await headers();
    requestId = h.get("x-request-id") ?? undefined;
    userId = h.get("x-user-id") ?? undefined;
  } catch {
    // Outside a request scope (cron, startup). Correlation is best-effort.
  }

  if (extra?.userId) userId = extra.userId;

  return buildLogger({
    requestId,
    userId,
    labels: extra?.labels,
    defaultSource: inferSourceFromLabels(extra?.labels),
  });
}

/**
 * Tiny helper: extract the request id from a `NextRequest`. Useful in
 * API route handlers that want to pass `rid` along to downstream
 * service calls or include it in error responses.
 */
export function readRequestId(req: { headers: { get(name: string): string | null } }): string | undefined {
  return req.headers.get("x-request-id") ?? undefined;
}
