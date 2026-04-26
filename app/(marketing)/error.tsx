"use client";

import { SegmentError } from "@/components/segment-error";

/**
 * Error boundary for the marketing segment (landing page, `/yasal/*`
 * legal pages, and other public content).
 *
 * These pages are the first thing unauthenticated visitors see; a raw
 * 500 on `/` or `/yasal/kvkk` damages brand trust far more than the
 * equivalent failure inside a logged-in area would. We still log via
 * `SegmentError` so operators see the spike, but present a recoverable
 * shell instead of the default Next.js error UI.
 */
export default function MarketingError({
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
      title="Sayfa yüklenemedi"
      location="marketing"
      backHref="/"
      backLabel="Ana sayfaya dön"
    />
  );
}
