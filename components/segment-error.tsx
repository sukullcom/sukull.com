"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { reportClientError } from "@/lib/report-error";
import { clientLogger } from "@/lib/client-logger";

/**
 * Next.js App Router `error.tsx` için ortak UI + loglama bileşeni.
 * Her route segment kendi `error.tsx`'inde bu bileşeni sarar ve `location`
 * değerini geçer; böylece error_log'a hangi alandan geldiği düşer.
 */
export function SegmentError({
  error,
  reset,
  title,
  location,
  backHref,
  backLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  location: string;
  backHref: string;
  backLabel: string;
}) {
  useEffect(() => {
    clientLogger.debug(`segment error [${location}]`, { error: error.message, digest: error.digest });
    reportClientError({
      error,
      location,
      metadata: error.digest ? { digest: error.digest } : undefined,
    });
  }, [error, location]);

  return (
    <div className="flex items-center justify-center py-10 px-4">
      <div className="max-w-lg w-full bg-card border border-red-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Bir sorun oluştu. Teknik detay aşağıdadır — geliştiriciye iletebilirsin.
        </p>
        <div className="bg-muted border rounded-lg p-3 text-xs font-mono text-foreground mb-4 break-all">
          <div>
            <span className="text-muted-foreground">message:</span>{" "}
            {error.message || "(boş)"}
          </div>
          {error.digest && (
            <div>
              <span className="text-muted-foreground">digest:</span> {error.digest}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" /> Tekrar dene
          </button>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
