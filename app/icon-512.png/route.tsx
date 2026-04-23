import { ImageResponse } from "next/og";

export const runtime = "edge";
export const revalidate = 86400;

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
    { width: 512, height: 512 },
  );
}
