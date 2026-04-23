"use client";

import { SegmentError } from "@/components/segment-error";

export default function AdminError({
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
      title="Admin paneli yüklenemedi"
      location="admin"
      backHref="/learn"
      backLabel="Ana sayfaya dön"
    />
  );
}
