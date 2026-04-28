/**
 * Postgres `check_rate_limit` sonuç satırından izin verilip verilmediğini çıkarır.
 * `Boolean(undefined) === false` olduğu için doğrudan Boolean() kullanılmaz.
 */
export function resolveAllowed(
  row: Record<string, unknown>,
  maxAttempts: number,
): boolean {
  const raw = row.allowed;
  if (typeof raw === "boolean") {
    return raw;
  }
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "t" || s === "true" || s === "1") return true;
    if (s === "f" || s === "false" || s === "0") return false;
  }
  const ccRaw = row.current_count ?? row.currentCount;
  if (ccRaw !== undefined && ccRaw !== null) {
    const n = Number(ccRaw);
    if (!Number.isNaN(n)) {
      return n <= maxAttempts;
    }
  }
  const rem = row.remaining ?? row.Remaining;
  if (typeof rem === "number" && rem > 0) {
    return true;
  }
  if (typeof rem === "string" && Number(rem) > 0) {
    return true;
  }
  return false;
}
