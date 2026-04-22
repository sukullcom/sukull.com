"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-error";

/**
 * Installs window-level listeners for errors and unhandled promise rejections.
 * These fire for crashes outside the React tree (event handlers, async code,
 * third-party scripts) which React error boundaries cannot catch.
 *
 * Rendered once from the root layout. Lives in its own "use client" island so
 * the layout itself can stay a server component.
 */
export function GlobalErrorListener() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      // Some browser extensions and third-party scripts surface benign errors
      // (e.g., cross-origin script errors with no stack). Skip them.
      if (!event.error && !event.message) return;
      reportClientError({
        error: event.error ?? event.message,
        location: "window.onerror",
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      reportClientError({
        error: event.reason ?? "Unhandled promise rejection",
        location: "window.onunhandledrejection",
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
