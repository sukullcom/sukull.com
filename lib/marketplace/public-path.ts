/** Giriş olmadan açılan vitrin. `/hizmet-veren` buraya girmez. */
export function isPublicMarketplacePath(pathname: string): boolean {
  return pathname === "/hizmet-ver" || pathname === "/hizmet" || pathname.startsWith("/hizmet/");
}

/** Reklam görseli için sabit örnek ekran. İlan listesine ve site haritasına girmez. */
export function isPublicExamplePath(pathname: string): boolean {
  return pathname === "/ornek/kaleci-kiralama";
}

export function isPublicShareImage(pathname: string): boolean {
  return pathname.includes("opengraph-image") || pathname.includes("twitter-image");
}
