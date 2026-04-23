"use client";

import { SegmentError } from "@/components/segment-error";

export default function ProtectedError({
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
      location="protected"
      backHref="/learn"
      backLabel="Derslere dön"
    />
  );
}
