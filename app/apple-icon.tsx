import { ImageResponse } from "next/og";

import { loadBrandMascotDataUrl } from "@/lib/load-brand-mascot-data-url";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS Ana Ekrana Ekle — `icon.tsx` ile aynı maskot, şeffaf zemin. */
export default async function AppleIcon() {
  const mascotSrc = await loadBrandMascotDataUrl();
  const imgSize = 168;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {mascotSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mascotSrc}
            width={imgSize}
            height={imgSize}
            alt=""
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#7c3aed",
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
