/**
 * Site genelinde marka maskotu (favicon, başlık çubuğu, PWA önizleme).
 * Çerçeve veya zemin rengi eklenmez.
 */
export const BRAND_MASCOT_PATH = "/heads/happy_excited_purple.svg" as const;

/**
 * `<Image>` ile güvenilir gösterim — Vercel Image Optimization çok büyük
 * SVG'leri (hero.svg ~20MB, heads/*.svg ~1.4MB) 400 ile reddeder.
 * Giriş / auth hero ve küçük logo alanlarında bunu kullanın.
 */
export const BRAND_MASCOT_DISPLAY_PATH = "/heads/happy_excited_purple.png" as const;

/** Kaynak PNG — `public/icons/pwa-*.png` ve `app/icon.png` buradan kopyalanır.
 *  PWA/favicon artık statik dosya; Satori (`ImageResponse`) kullanılmıyor. */
export const BRAND_MASCOT_FILE = "public/heads/happy_excited_purple.png" as const;
export const BRAND_MASCOT_MIME = "image/png" as const;
