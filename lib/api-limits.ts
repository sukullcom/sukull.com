/**
 * Central server-side caps for point-awarding endpoints.
 *
 * These are a defense-in-depth layer: the API route at `/api/user/points/add`
 * validates them, the server action `addPointsToUser` re-validates them, and
 * the legitimate client call sites never exceed them. Any incoming request
 * beyond the cap is rejected with `400`/thrown rather than trimmed silently.
 *
 * ## Threat model
 *
 * A logged-in user can invoke a `"use server"` action directly from DevTools
 * with an arbitrary payload — Next.js does not magically validate action
 * arguments. Historically we only gated the REST route (`pointsAdd` rate
 * limit + `MAX_POINTS_ADD_PER_REQUEST`) while the games called the action
 * *directly*. A single `addPointsToUser(999_999_999, { gameType: 'snake' })`
 * call would corrupt the leaderboard and every school aggregate.
 *
 * ## Budgeting
 *
 * - `MAX_POINTS_ADD_PER_REQUEST` — absolute ceiling for any `addPointsToUser`
 *   call that does NOT name a specific `gameType`. Kept at 250 to match
 *   the legacy REST policy.
 * - `GAME_MAX_SCORE_PER_CALL` — per-game ceiling. Set slightly above the
 *   realistic 99th-percentile score so honest play is never blocked, but a
 *   fabricated payload is. Review these quarterly against `activity_log`
 *   aggregates (see SQL in `docs/OBSERVABILITY.md`).
 */

/** Default upper bound when no `gameType` is supplied. */
export const MAX_POINTS_ADD_PER_REQUEST = 250;

/**
 * Realistic per-call maximums per game. Values reflect the upper envelope
 * a skilled player can plausibly hit in a single finished round. Unknown
 * game types fall back to `MAX_POINTS_ADD_PER_REQUEST`.
 *
 * When adding a new game, put its canonical `gameType` key here *before*
 * wiring the client call so we don't ship an unguarded entry point.
 */
export const GAME_MAX_SCORE_PER_CALL: Readonly<Record<string, number>> = {
  // Classic arcade games — score scales with round length and accuracy.
  "snakable": 1200,
  "speed-math": 800,
  "stroop": 800,
  "memory-match": 600,
  "memory-matrix": 800,
  "pattern-memory": 600,
  "true-false": 600,
  "subscribe": 1000, // lyrics game
  // Lab experiences award points per matched concept; scores here are tighter.
  "human-body": 800,
  "journey-of-food": 800,
};

/** Hard ceiling above which *no* game is allowed to award on a single call. */
export const GLOBAL_POINTS_HARD_CEILING = 2000;

/**
 * Resolve the appropriate per-call cap given a `gameType`.
 *
 * - No `gameType` → `MAX_POINTS_ADD_PER_REQUEST`.
 * - Known `gameType` → the game-specific cap.
 * - Unknown `gameType` → `MAX_POINTS_ADD_PER_REQUEST` (strict fallback).
 *
 * The return value never exceeds `GLOBAL_POINTS_HARD_CEILING`.
 */
export function resolvePointsCap(gameType?: string): number {
  const cap = gameType && gameType in GAME_MAX_SCORE_PER_CALL
    ? GAME_MAX_SCORE_PER_CALL[gameType]
    : MAX_POINTS_ADD_PER_REQUEST;
  return Math.min(cap, GLOBAL_POINTS_HARD_CEILING);
}
