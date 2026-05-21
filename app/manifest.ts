import type { MetadataRoute } from "next";

/**
 * PWA manifest.
 *
 * İkon kaynakları:
 *  • `/icon`        — Next.js dinamik PNG, Satori ile `happy_excited_purple.png`
 *                     dosyasından üretilir. Boyut parametrelendiriliyor (sizes).
 *  • `/apple-icon`  — Aynı kaynak, iOS için 180×180.
 *  • `/heads/happy_excited_purple.png` — Ham PNG (724KB). Satori başarısız
 *    olursa Android/Chrome bu fallback'i kullanabilsin diye listede.
 *
 * Android adaptive icon: `purpose: "maskable"` ile aynı kaynağı sunuyoruz.
 * Satori şeffaf zemin üretiyor; sistem maskesi maskotu çerçeveye oturtur.
 * Mascot büyük çerçevede tamamen görünmez — yine de Chrome adaptive
 * desteği olmazsa "any" kullanır. (İdeal maskable için ortada güvenli
 * bölge bırakan ayrı bir 512×512 kare lazım; gerekirse sonra ekleriz.)
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
      // Birincil PWA ikonu — Android home screen + splash screen burayı okur.
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
      // iOS Ana Ekrana Ekle.
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      // Fallback: ham PNG. Satori herhangi bir nedenle çalışmazsa
      // Chrome installer bu dosyaya iner.
      {
        src: "/heads/happy_excited_purple.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
