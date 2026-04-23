/**
 * Minimal client-side logger.
 *
 * The browser is noisy: React hydration warnings, browser extensions,
 * third-party scripts, etc. We deliberately keep the client sink tiny —
 * only `warn` and `error` make it across the wire to `error_log` (via
 * `/api/errors`, see `lib/report-error.ts`). `info` / `debug` stay in the
 * browser console and are silenced in production.
 *
 * Usage:
 *   ```ts
 *   import { clientLogger } from "@/lib/client-logger";
 *   clientLogger.info("toggle opened");
 *   clientLogger.warn("invalid payload", { field });
 *   clientLogger.error({ message: "fetch failed", error, location: "BookLesson" });
 *   ```
 *
 * Pair with the global error listener in `components/global-error-listener.tsx`
 * which already forwards window.onerror / unhandledrejection events
 * through `reportClientError`. Call this logger from explicit catch
 * blocks where you know the operation name / location.
 */

import { reportClientError } from "./report-error";

export type ClientLogFields = Record<string, unknown>;

const IS_DEV =
  typeof process !== "undefined" && process.env.NODE_ENV !== "production";

function devOnly(fn: () => void): void {
  if (IS_DEV) fn();
}

export type ClientLogErrorArgs = {
  message: string;
  error?: unknown;
  /** Short location identifier: component name, hook name, user action. */
  location?: string;
  fields?: ClientLogFields;
};

export const clientLogger = {
  debug(message: string, fields?: ClientLogFields) {
    devOnly(() => {
      if (fields) console.debug(`[client:dbg] ${message}`, fields);
      else console.debug(`[client:dbg] ${message}`);
    });
  },
  info(message: string, fields?: ClientLogFields) {
    devOnly(() => {
      if (fields) console.info(`[client:inf] ${message}`, fields);
      else console.info(`[client:inf] ${message}`);
    });
  },
  /**
   * Warnings land in the browser console in all environments. We don't
   * ship warnings to the server — too much noise from extensions and
   * transient hydration issues. Upgrade to `error` when the issue is
   * user-impacting.
   */
  warn(message: string, fields?: ClientLogFields) {
    if (fields) console.warn(`[client:wrn] ${message}`, fields);
    else console.warn(`[client:wrn] ${message}`);
  },
  /**
   * Emit to the browser console AND ship to `error_log` via the
   * fire-and-forget beacon in `reportClientError`. Never throws.
   */
  error(args: ClientLogErrorArgs) {
    const { message, error, location, fields } = args;
    if (IS_DEV) {
      if (error !== undefined) {
        console.error(`[client:err] ${message}`, error, fields ?? {});
      } else {
        console.error(`[client:err] ${message}`, fields ?? {});
      }
    } else if (error !== undefined) {
      console.error(`[client:err] ${message}`, error);
    } else {
      console.error(`[client:err] ${message}`);
    }
    reportClientError({
      error: error ?? message,
      location,
      metadata: fields,
    });
  },
};

export type ClientLogger = typeof clientLogger;
