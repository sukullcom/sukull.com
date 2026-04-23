"use client";

import { SegmentError } from "@/components/segment-error";

export default function PrivateLessonError({
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
      title="Özel ders sayfası yüklenemedi"
      location="private-lesson"
      backHref="/private-lesson"
      backLabel="Özel derse dön"
    />
  );
}
