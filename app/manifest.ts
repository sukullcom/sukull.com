import type { MetadataRoute } from "next";

/**
 * PWA manifest. Enables "Add to Home Screen" on iOS/Android and unlocks
 * lightweight app-like behaviour (standalone window, theme colour, splash).
 *
 * Icons are emitted by `app/icon.tsx` and `app/apple-icon.tsx` (Next.js auto-
 * generates `<link rel="icon" …>` tags and serves them at `/icon.png`, etc.).
 * We reference those generated paths here so the manifest stays in sync.
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
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
