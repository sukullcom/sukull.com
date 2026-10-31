import type { MetadataRoute } from "next";

import {
  PWA_ICON_192,
  PWA_ICON_512,
  PWA_MANIFEST_ID,
} from "@/lib/pwa-icons";

/**
 * PWA manifest — ikonlar **statik PNG** (`public/icons/`).
 *
 * Dinamik `/icon` (Satori) kaldırıldı: 724KB PNG base64 ile bazen
 * boş / "S" fallback üretiyordu ve CDN+PWA önbelleği eski kalıyordu.
 * `?v=` + `id` ile yükleme sonrası doğru maskot gelir.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: PWA_MANIFEST_ID,
    name: "Sukull — Ücretsiz hizmet ilanı",
    short_name: "Sukull",
    description:
      "İhtiyacın olan hizmeti seç, ücretsiz ilan aç, teklifleri karşılaştır. Komisyon yok.",
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
        src: PWA_ICON_512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ICON_192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
