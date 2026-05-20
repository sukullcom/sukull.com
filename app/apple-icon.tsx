import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS Ana Ekrana Ekle — `icon.tsx` ile aynı kompozisyon, 180×180 */
export default async function AppleIcon() {
  let mascotSrc: string | null = null;
  try {
    const buf = await readFile(
      path.join(process.cwd(), "public", "favicon.ico"),
    );
    mascotSrc = `data:image/x-icon;base64,${buf.toString("base64")}`;
  } catch {
    /* yoksay */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#84cc16",
        }}
      >
        {mascotSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mascotSrc}
            width={130}
            height={130}
            alt=""
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#ffffff",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            S
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
