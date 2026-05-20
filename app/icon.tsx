import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/**
 * PWA / ana ekran ikonu — lime arka plan + ortalanmış maskot.
 * SVG maskotu doğrudan kullanmak Android’de beyaz/siyah çerçeve yapıyordu;
 * burada maskot ~%72 ölçekte, arka plan theme_color ile dolduruluyor.
 */
export default async function Icon() {
  let mascotSrc: string | null = null;
  try {
    const buf = await readFile(
      path.join(process.cwd(), "public", "favicon.ico"),
    );
    mascotSrc = `data:image/x-icon;base64,${buf.toString("base64")}`;
  } catch {
    /* favicon yoksa metin yedeği */
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
          // eslint-disable-next-line @next/next/no-img-element -- ImageResponse/Satori
          <img
            src={mascotSrc}
            width={368}
            height={368}
            alt=""
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              fontSize: 200,
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
