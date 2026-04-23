import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon (180×180). Matches the default icon design but ships
 * without rounded corners — iOS applies its own mask.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #84cc16 0%, #166534 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 130,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
