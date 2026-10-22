type TrackParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Reklam pikselleri bağlanınca aynı olay adları kullanılır. */
export function trackMarketplace(event: string, params: TrackParams = {}) {
  if (typeof window === "undefined") return;
  const payload: Record<string, unknown> = { event };
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined) payload[key] = params[key];
  });
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}
