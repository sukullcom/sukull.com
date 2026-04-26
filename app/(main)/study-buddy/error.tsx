"use client";

import { SegmentError } from "@/components/segment-error";

/**
 * Error boundary for study-buddy (general chat + posts). This segment
 * pulls a lot of `jsonb` participant data and is the most common
 * source of "unexpected shape" crashes historically (e.g. a post with
 * a null author). Scoping the boundary here means one bad message
 * doesn't brick the whole `/study-buddy` shell.
 */
export default function StudyBuddyError({
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
      title="Sohbet yüklenemedi"
      location="study-buddy"
      backHref="/learn"
      backLabel="Ana sayfaya dön"
    />
  );
}
