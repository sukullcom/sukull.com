type TrackParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

const ADS_CONVERSIONS: Record<string, string | undefined> = {
  ilan_gonderildi:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ILAN ??
    "AW-18531702851/EPi8CL6-xaYdEMOwzYRF",
  hizmet_veren_kayit: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_HIZMET_VER,
};

/** Reklam pikselleri bağlanınca aynı olay adları kullanılır. */
export function trackMarketplace(event: string, params: TrackParams = {}) {
  if (typeof window === "undefined") return;
  const payload: Record<string, unknown> = { event };
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined) payload[key] = params[key];
  });
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);

  if (typeof window.gtag !== "function") return;
  window.gtag("event", event, payload);
  const sendTo = ADS_CONVERSIONS[event];
  if (sendTo) {
    window.gtag("event", "conversion", {
      send_to: sendTo,
      value: 1.0,
      currency: "TRY",
      ...payload,
    });
  }
}
