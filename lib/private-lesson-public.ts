/**
 * Özel ders pazarında kayıtsız gezilebilen sayfalar.
 * İlan/mesaj/teklif yazmak oturum ister; hub, eğitmenler ve açık ilanlar public.
 */
const GATED_PREFIXES = [
  "/private-lesson/my-listings",
  "/private-lesson/messages",
  "/private-lesson/teacher-dashboard",
  "/private-lesson/give",
  "/private-lesson/credits",
] as const;

export function isPublicPrivateLessonPath(pathname: string): boolean {
  if (
    pathname !== "/private-lesson" &&
    !pathname.startsWith("/private-lesson/")
  ) {
    return false;
  }
  return !GATED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
