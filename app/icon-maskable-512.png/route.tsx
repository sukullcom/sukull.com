import { ImageResponse } from "next/og";

export const runtime = "edge";
export const revalidate = 86400;

/**
 * Maskable icon (512×512). Android adaptive icons crop the outer ~20% into
 * various shapes (circle, squircle, teardrop). Keep the "S" inside the
 * central safe zone — no rounded corners here so the full square can be
 * masked by the OS without hiding brand colour.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#65a30d",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 280, // smaller → stays inside safe zone after masking
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        S
      </div>
    ),
    { width: 512, height: 512 },
  );
}
