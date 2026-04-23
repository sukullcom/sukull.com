import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sukull — Öğrenmeyi eğlenceli hale getiren platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Open Graph preview image (1200×630) for WhatsApp, LinkedIn, Twitter, etc.
 *
 * Rendered server-side by Next.js `ImageResponse` (Satori). Emitting a real
 * PNG here (instead of a static .svg asset) because:
 *   - WhatsApp, iMessage and LinkedIn often reject SVG OG previews.
 *   - This stays in sync with brand copy without a design round-trip.
 *
 * Per-page Open Graph images can override this by creating their own
 * `opengraph-image.tsx` (e.g. teacher profiles in the future).
 */
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #84cc16 0%, #65a30d 50%, #166534 100%)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          padding: "72px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 128,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          Sukull
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 24,
            maxWidth: 980,
          }}
        >
          Öğrenmeyi eğlenceli hale getiren platform
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            opacity: 0.92,
            lineHeight: 1.4,
            maxWidth: 960,
          }}
        >
          Dersler · Beyin oyunları · Özel ders · Çalışma arkadaşı · Yarışma
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 24,
            fontWeight: 600,
            padding: "14px 28px",
            background: "rgba(255, 255, 255, 0.18)",
            borderRadius: 999,
            backdropFilter: "blur(8px)",
          }}
        >
          sukull.com
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
