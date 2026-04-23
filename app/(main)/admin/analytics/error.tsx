"use client";

import { SegmentError } from "@/components/segment-error";

export default function AnalyticsError({
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
      title="Analytics sayfası yüklenemedi"
      location="admin/analytics"
      backHref="/admin"
      backLabel="Admin'e dön"
    />
  );
}
