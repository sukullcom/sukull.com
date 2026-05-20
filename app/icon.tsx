import { ImageResponse } from "next/og";

import { loadBrandMascotDataUrl } from "@/lib/load-brand-mascot-data-url";

export const runtime = "nodejs";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** PWA / sekme ikonu — şeffaf zemin, `happy_excited_purple` maskot. */
export default async function Icon() {
  const mascotSrc = await loadBrandMascotDataUrl();
  const imgSize = 480;

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
          // eslint-disable-next-line @next/next/no-img-element -- ImageResponse/Satori
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
              fontSize: 200,
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
