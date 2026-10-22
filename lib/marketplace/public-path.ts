/** Giriş olmadan açılan vitrin. `/hizmet-veren` buraya girmez. */
export function isPublicMarketplacePath(pathname: string): boolean {
  return pathname === "/hizmet-ver" || pathname === "/hizmet" || pathname.startsWith("/hizmet/");
}

export function isPublicShareImage(pathname: string): boolean {
  return pathname.includes("opengraph-image") || pathname.includes("twitter-image");
}
