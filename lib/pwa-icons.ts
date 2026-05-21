/**
 * PWA / favicon önbellek kırma.
 *
 * Manifest veya ikon URL'si değişmeden tarayıcı + yüklü PWA eski ikonu
 * tutar. Sürümü artırınca yeni deploy sonrası "sil-yükle" ile doğru
 * maskot gelir.
 */
export const PWA_ICON_VERSION = "5" as const;

const v = PWA_ICON_VERSION;

/** Manifest + metadata — statik PNG, Satori yok. */
export const PWA_ICON_512 = `/icons/pwa-512.png?v=${v}` as const;
export const PWA_ICON_192 = `/icons/pwa-192.png?v=${v}` as const;

/** Web App Manifest `id` — Chrome manifest önbelleğini ayırır. */
export const PWA_MANIFEST_ID = `sukull-pwa-${v}` as const;
