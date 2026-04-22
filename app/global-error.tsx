"use client";

import { useEffect } from "react";
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
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            background: "#f9fafb",
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              background: "#fff",
              border: "1px solid #fecaca",
              borderRadius: 16,
              padding: "1.5rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 0.5rem" }}>
              Beklenmedik bir hata oluştu
            </h1>
            <p style={{ fontSize: 14, color: "#4b5563", margin: "0 0 1rem" }}>
              Üzgünüz, bir sorun yaşandı. Tekrar deneyebilir ya da ana sayfaya
              dönebilirsin.
            </p>
            {error.digest && (
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: "#6b7280",
                  marginBottom: "1rem",
                }}
              >
                Referans: {error.digest}
              </div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={reset}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  background: "#111827",
                  color: "#fff",
                  border: 0,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Tekrar dene
              </button>
              <a
                href="/"
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  color: "#374151",
                  fontSize: 14,
                  textDecoration: "none",
                }}
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
