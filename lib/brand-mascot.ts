/**
 * Site genelinde marka maskotu (favicon, başlık çubuğu, PWA önizleme).
 * Çerçeve veya zemin rengi eklenmez.
 *
 * Client tarafı `<Image src={BRAND_MASCOT_PATH}>` için SVG kullanılır —
 * `next/image` zaten optimize edip uygun formata çeviriyor.
 */
export const BRAND_MASCOT_PATH = "/heads/happy_excited_purple.svg" as const;

/** Kaynak PNG — `public/icons/pwa-*.png` ve `app/icon.png` buradan kopyalanır.
 *  PWA/favicon artık statik dosya; Satori (`ImageResponse`) kullanılmıyor. */
export const BRAND_MASCOT_FILE = "public/heads/happy_excited_purple.png" as const;
export const BRAND_MASCOT_MIME = "image/png" as const;
