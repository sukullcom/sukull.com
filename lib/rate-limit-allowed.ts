/**
 * Postgres `check_rate_limit` sonuç satırından izin verilip verilmediğini çıkarır.
 * `Boolean(undefined) === false` olduğu için doğrudan Boolean() kullanılmaz.
 *
 * Bazı sürücü / proxy kombinasyonlarında sütun adları farklı casing ile gelebilir;
 * `normalizeRateLimitRow` ile tek forma indirgenir.
 */
export function normalizeRateLimitRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.toLowerCase()] = v;
  }
  return out;
}

function numish(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function resolveAllowed(
  row: Record<string, unknown>,
  maxAttempts: number,
): boolean {
  const r = normalizeRateLimitRow(row);
  const raw = r.allowed;

  if (typeof raw === "boolean") {
    return raw;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw !== 0;
  }
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "t" || s === "true" || s === "1") return true;
    if (s === "f" || s === "false" || s === "0") return false;
  }

  const cc = numish(r.current_count);
  if (cc !== null) {
    return cc <= maxAttempts;
  }

  const rem = numish(r.remaining);
  if (rem !== null && rem > 0) {
    return true;
  }

  return false;
}
