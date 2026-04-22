/**
 * Validate a Turkish National ID (TC Kimlik) number using the official
 * checksum algorithm.
 *
 * Rules:
 *   - 11 digits, only 0-9
 *   - First digit cannot be 0
 *   - 10th digit = ((sum of odd-indexed d1,d3,d5,d7,d9) * 7 - sum of even-indexed d2,d4,d6,d8) mod 10
 *   - 11th digit = (sum of first 10 digits) mod 10
 *
 * Pure function — no side effects, no I/O. Safe to test in isolation.
 */
export function isValidTcKimlik(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const digits = value.trim();
  if (!/^\d{11}$/.test(digits)) return false;
  if (digits[0] === "0") return false;

  const d = digits.split("").map(Number);
  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const tenth = ((oddSum * 7) - evenSum) % 10;
  if ((tenth + 10) % 10 !== d[9]) return false;

  const last = (oddSum + evenSum + d[9]) % 10;
  return last === d[10];
}
