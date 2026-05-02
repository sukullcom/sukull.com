/**
 * Server action / fetch sırasında beklenmedik ağ veya platform hatalarında
 * kullanıcıya gösterilecek kısa Türkçe mesaj (toast / inline error).
 */
export function getClientAuthTransientErrorMessage(error: unknown): string {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const m = msg.toLowerCase();

  if (
    m.includes("rate limit") ||
    m.includes("429") ||
    m.includes("too many requests")
  ) {
    return "Sistem şu an yoğun. Lütfen yaklaşık bir dakika sonra tekrar deneyin.";
  }
  if (
    m.includes("timeout") ||
    m.includes("timed out") ||
    m.includes("504") ||
    m.includes("503") ||
    m.includes("502")
  ) {
    return "Sunucu yanıt veremedi. Lütfen kısa bir süre sonra tekrar deneyin.";
  }
  if (
    m.includes("failed to fetch") ||
    m.includes("load failed") ||
    m.includes("networkerror") ||
    m.includes("network request failed")
  ) {
    return "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.";
  }
  return "İşlem tamamlanamadı. Lütfen bir dakika sonra tekrar deneyin.";
}
