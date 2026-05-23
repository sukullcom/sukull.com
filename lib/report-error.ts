import { isClientNoise } from "@/lib/client-noise-patterns";

const CLIENT_DEDUPE_MS = 10 * 60 * 1000; // 10 dk — aynı oturumda tekrar POST yok

function clientDedupeKey(message: string, location?: string): string {
  const loc = location ?? "unknown";
  let norm = message.trim().slice(0, 120);
  if (/Minified React error #419/i.test(norm)) {
    norm = "React hydration mismatch (#419)";
  }
  return `client-err:${loc}:${norm}`;
}


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

    // Bilinen 3. taraf / tarayıcı gürültüsü → DB'ye götürme. Dedupe
    // sessionStorage'ını da kirletmemek için filtre dedupe'tan ÖNCE
    // uygulanır.
    const filename =
      metadata && typeof metadata.filename === "string"
        ? metadata.filename
        : undefined;
    if (isClientNoise(message || "", stack, filename)) {
      return;
    }

    try {
      const key = clientDedupeKey(message || "", location);
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const last = Number(raw);
        if (Number.isFinite(last) && Date.now() - last < CLIENT_DEDUPE_MS) {
          return;
        }
      }
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      /* private mode / storage full */
    }

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
