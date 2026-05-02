"use client";

import { useEffect } from "react";

import "./globals.css";

import { reportClientError } from "@/lib/report-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      error,
      location: "global-error",
      metadata: error.digest ? { digest: error.digest } : undefined,
    });
  }, [error]);

  return (
    <html lang="tr">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-destructive/25 bg-card p-6 shadow-sm">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Beklenmedik bir hata oluştu
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Üzgünüz, bir sorun yaşandı. Tekrar deneyebilir ya da ana sayfaya
              dönebilirsin.
            </p>
            {error.digest ? (
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                Referans: {error.digest}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Tekrar dene
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Ana sayfa
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
