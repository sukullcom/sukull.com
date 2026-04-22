"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { reportClientError } from "@/lib/report-error";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Analytics page error:", error);
    reportClientError({
      error,
      location: "admin/analytics",
      metadata: error.digest ? { digest: error.digest } : undefined,
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h1 className="text-lg font-semibold text-gray-900">
            Analytics sayfası yüklenemedi
          </h1>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Bir sorun oluştu. Teknik detay aşağıdadır — geliştiriciye iletebilirsin.
        </p>
        <div className="bg-gray-50 border rounded-lg p-3 text-xs font-mono text-gray-700 mb-4 break-all">
          <div>
            <span className="text-gray-500">message:</span>{" "}
            {error.message || "(boş)"}
          </div>
          {error.digest && (
            <div>
              <span className="text-gray-500">digest:</span> {error.digest}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" /> Tekrar dene
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Admin&apos;e dön
          </Link>
        </div>
      </div>
    </div>
  );
}
