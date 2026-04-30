/**
 * Özel ders (ilan, teklif, sohbet listesi, eğitmen rehberi) için görünen ad:
 * onaylı başvurudaki ad + soyad; yoksa hesap adı; o da yoksa "Eğitmen".
 */
export function teacherPrivateLessonDisplayName(
  applicationFirst: string | null | undefined,
  applicationLast: string | null | undefined,
  accountName: string | null | undefined,
): string {
  const parts = [applicationFirst, applicationLast]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((x) => x.length > 0);
  if (parts.length > 0) return parts.join(" ");
  const acc = (accountName ?? "").trim();
  return acc.length > 0 ? acc : "Eğitmen";
}
