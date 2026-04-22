/**
 * Client-side error reporter. Fire-and-forget; never throws.
 * POSTs to /api/errors which persists into Postgres `error_log`.
 */
export function reportClientError(input: {
  error: unknown;
  location?: string;
  metadata?: Record<string, unknown>;
}): void {
  if (typeof window === "undefined") return;

  try {
    const { error, location, metadata } = input;
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    const stack = error instanceof Error ? error.stack : undefined;

    const body = JSON.stringify({
      message: message || "Unknown client error",
      stack,
      location,
      url: window.location.href,
      metadata,
    });

    // Prefer sendBeacon so the request survives page navigation/unloads.
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/errors", blob);
      if (ok) return;
    }

    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never propagate errors from the error reporter itself.
  }
}
