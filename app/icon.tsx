import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/**
 * Default app icon. Next.js emits this at `/icon.png` and automatically
 * wires up `<link rel="icon" sizes="512x512" href="/icon.png">`.
 *
 * Design: a bold "S" monogram on the brand lime gradient. Rendered at edge
 * so cold starts are negligible and deploys stay deterministic.
 */
export default function Icon() {
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
          fontSize: 380,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          borderRadius: "22%",
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
