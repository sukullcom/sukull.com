/**
 * Site genelinde marka maskotu (favicon, başlık çubuğu, PWA önizleme).
 * Çerçeve veya zemin rengi eklenmez.
 *
 * Client tarafı `<Image src={BRAND_MASCOT_PATH}>` için SVG kullanılır —
 * `next/image` zaten optimize edip uygun formata çeviriyor.
 */
export const BRAND_MASCOT_PATH = "/heads/happy_excited_purple.svg" as const;

/** Sunucu tarafı ikon üretimi (`app/icon.tsx`, `app/apple-icon.tsx`) için
 *  dosya yolu — **PNG kullanıyoruz**.
 *
 *  Neden SVG değil PNG? Satori (Next.js `ImageResponse` motoru) 1.4MB'lık
 *  içine gömülü base64-PNG'li karmaşık SVG'yi sessizce yanlış render
 *  edebiliyor (bazen mascot yerine fallback "S" gösteriliyor). PNG'yi
 *  doğrudan embed etmek hem güvenli hem hızlı: dosya 724KB, Satori
 *  yeniden render etmiyor, sadece resize ediyor.
 */
export const BRAND_MASCOT_FILE = "public/heads/happy_excited_purple.png" as const;
/** PNG'nin MIME tipi — `data:` URL üretiminde kullanılır. */
export const BRAND_MASCOT_MIME = "image/png" as const;
