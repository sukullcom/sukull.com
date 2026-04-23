/**
 * Cross-domain helpers and constants used by multiple query modules.
 *
 * Keep this file tiny. Anything beyond a handful of lines probably belongs
 * in its own domain module.
 */

/** How long (ms) before a lost heart regenerates. 4 hours. */
export const HEART_REGEN_INTERVAL_MS = 4 * 60 * 60 * 1000;

/** Max hearts a free-plan user can hold. */
export const HEART_MAX = 5;

/**
 * Monday-anchored start of the week containing `date`. Normalized to
 * 00:00:00.000 local time so it can be used as a stable key.
 */
export function getWeekStartDate(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** End of the week (exclusive) — 7 days after `getWeekStartDate`. */
export function getWeekEndDate(date: Date): Date {
  const result = getWeekStartDate(date);
  result.setDate(result.getDate() + 7);
  return result;
}
