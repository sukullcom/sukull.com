"use client";

import { SegmentError } from "@/components/segment-error";

export default function LearnError({
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
      title="Dersler yüklenemedi"
      location="learn"
      backHref="/courses"
      backLabel="Kurs seçimine dön"
    />
  );
}
