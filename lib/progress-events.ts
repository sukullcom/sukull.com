// Central event-bus helpers for daily progress/challenge refresh.
// Components listen to these events to refresh immediately instead of polling.

export const PROGRESS_UPDATED_EVENT = "sukull:progress-updated";
export const CHALLENGE_UPDATED_EVENT = "sukull:challenge-updated";

/**
 * Dispatch a progress-updated event so components like <DailyProgress />
 * refresh immediately after points/hearts/streak change.
 * Safe to call from both client and server contexts (no-op on server).
 */
export function emitProgressUpdated(detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROGRESS_UPDATED_EVENT, { detail }));
}

/**
 * Dispatch a challenge-updated event so components like <DailyChallenge />
 * refresh immediately after challenge progress/claim changes.
 */
export function emitChallengeUpdated(detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHALLENGE_UPDATED_EVENT, { detail }));
}
