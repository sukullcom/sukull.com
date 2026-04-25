import "server-only";

/**
 * Drizzle `db.execute` with the node-postgres driver returns a pg
 * `QueryResult` object `{ rows, rowCount, ... }` for ad-hoc SQL. Some
 * call sites incorrectly treat the return value as `T[]`, which
 * makes `array.map` throw and `for...of` fail ("not iterable").
 *
 * A few paths (e.g. rate limits) already normalize `.rows`; this helper
 * centralises that.
 */
export function queryResultRows<T = Record<string, unknown>>(
  result: unknown,
): T[] {
  if (Array.isArray(result)) return result as T[];
  if (
    result !== null &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}
