import type { MetadataRoute } from "next";

/**
 * PWA manifest. Icons use `public/mascot_purple.svg` (same as root metadata).
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
    background_color: "#ffffff",
    theme_color: "#84cc16",
    categories: ["education", "productivity", "learning"],
    icons: [
      {
        src: "/mascot_purple.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/mascot_purple.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
