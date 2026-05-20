import type { MetadataRoute } from "next";

/**
 * PWA manifest. İkonlar `app/icon.tsx` / `app/apple-icon.tsx` (PNG, lime zemin).
 * SVG maskot + beyaz `background_color` Android’de çerçeve yapıyordu — kaldırıldı.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sukull — Öğrenmeyi Eğlenceli Hale Getiren Platform",
    short_name: "Sukull",
    description:
      "Derslerini tamamla, beyin oyunlarıyla pratik yap, arkadaşlarınla yarış ve özel derslerle ilerle.",
    lang: "tr",
    start_url: "/learn",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#84cc16",
    theme_color: "#84cc16",
    categories: ["education", "productivity", "learning"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
