"use client";

import { SegmentError } from "@/components/segment-error";

/**
 * Error boundary for the quiz / lesson segment.
 *
 * A raw crash here is especially costly: the user may have spent 5+
 * minutes answering challenges, and a Next.js default 500 page wipes
 * the transient progress shown on screen (hearts, points, streak
 * animation). Wrapping in `SegmentError` lets us:
 *
 *   • Report the crash to `error_log` with `location = "lesson"` so
 *     we can see which lesson ids break most often.
 *   • Offer a `reset()` button — Next.js re-renders the segment in
 *     place, so a transient bad fetch can often self-heal without a
 *     full page reload.
 *   • Fall back to `/learn` instead of the marketing root, which is
 *     the nearest meaningful destination for an authenticated learner.
 */
export default function LessonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      error={error}
      reset={reset}
      title="Ders yüklenemedi"
      location="lesson"
      backHref="/learn"
      backLabel="Derslere dön"
    />
  );
}
