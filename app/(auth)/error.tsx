"use client";

import { SegmentError } from "@/components/segment-error";

/**
 * Error boundary for the auth segment (login, create-account,
 * forgot-password, verify-email, confirm, etc.).
 *
 * Without this boundary, a thrown error inside the Supabase SSR client
 * or a form action surfaces as the raw Next.js 500 page — which, on
 * auth, is especially hostile: users can't recover without guessing at
 * a URL. Falling back to the marketing root gives them at least one
 * working link and preserves our brand chrome.
 */
export default function AuthError({
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
      title="Giriş akışında bir sorun oluştu"
      location="auth"
      backHref="/"
      backLabel="Ana sayfaya dön"
    />
  );
}
