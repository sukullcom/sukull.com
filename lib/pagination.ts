/**
 * React Admin-compatible `Range: items=<start>-<end>` header parsing with
 * defensive bounds. Every admin list endpoint (`/api/lessons`,
 * `/api/courses`, `/api/units`, `/api/challenges`, `/api/challengeOptions`)
 * historically duplicated the same parser, with three sharp edges:
 *
 *   1. `parseInt` on a malformed header returns `NaN`. `limit = end - start
 *      + 1` then propagates `NaN` into Drizzle's `.limit(NaN)`, which
 *      Postgres rejects with a confusing driver error (or, worse, silently
 *      returns 0 rows depending on the client).
 *   2. Clients can send absurd ranges (`items=0-999999`) and force an
 *      uncapped `LIMIT`. We cap at `MAX_LIMIT` here.
 *   3. Negative / inverted ranges (`items=9-0`) crash or return nothing.
 *
 * The helper enforces sane defaults and a single source of truth for
 * ordering between admin endpoints.
 */
export const MAX_PAGE_LIMIT = 100;

export type PageRange = {
  /** Zero-based offset into the result set. */
  start: number;
  /** Inclusive end index; `end < start + MAX_PAGE_LIMIT`. */
  end: number;
  /** `end - start + 1`, always in [1, MAX_PAGE_LIMIT]. */
  limit: number;
};

export function parseRangeHeader(
  rangeHeader: string | null | undefined,
  maxLimit: number = MAX_PAGE_LIMIT,
): PageRange {
  const header = (rangeHeader ?? "items=0-9").trim();
  const eq = header.indexOf("=");
  const value = eq >= 0 ? header.slice(eq + 1) : header;
  const dash = value.indexOf("-");
  const startStr = dash >= 0 ? value.slice(0, dash) : value;
  const endStr = dash >= 0 ? value.slice(dash + 1) : "";

  const rawStart = Number.parseInt(startStr, 10);
  const rawEnd = Number.parseInt(endStr, 10);

  const start = Number.isFinite(rawStart) && rawStart >= 0 ? rawStart : 0;
  const fallbackEnd = start + Math.min(10, maxLimit) - 1;
  let end = Number.isFinite(rawEnd) && rawEnd >= start ? rawEnd : fallbackEnd;

  // Cap the maximum span so a misbehaving client can't force an
  // unbounded scan by sending `items=0-10000`.
  if (end - start + 1 > maxLimit) {
    end = start + maxLimit - 1;
  }

  return { start, end, limit: end - start + 1 };
}

/**
 * Safely coerce a user-supplied positive integer (body `limit`, query
 * `?limit=`, `?offset=`, etc.) with a default and a hard cap. Returns
 * `defaultValue` for `null`, `undefined`, non-numeric strings, NaN,
 * Infinity, zero, and negatives.
 *
 * This replaces ad-hoc `parseInt(x) || 0` + `Math.min(x, MAX)` chains
 * scattered across admin/list endpoints which all had the same bug
 * class: `Math.min(NaN, MAX)` is `NaN`, which Drizzle then passes to
 * Postgres as `LIMIT NaN` and fails opaquely at execution time.
 */
export function clampPositiveInt(
  raw: unknown,
  defaultValue: number,
  maxValue: number,
): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return Math.min(defaultValue, maxValue);
  return Math.min(Math.floor(n), maxValue);
}
