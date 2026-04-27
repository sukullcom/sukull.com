/**
 * Supabase OAuth / e-posta doğrulama için `redirectTo` hedefi.
 * PKCE `code_verifier` deponun **tıklanan sayfa ile aynı origin**de olmasını gerektirir;
 * bu yüzden `NEXT_PUBLIC_APP_URL` ile “zorla” başka hosta yönlendirmeyin.
 *
 * Üretimde: Supabase → Auth → URL Configuration → Redirect URLs içine
 * gerçekten ziyaret edilen köklerin tamamı (`https://sukull.com` ve gerekirse
 * `https://www.sukull.com`) + `/api/auth/callback` ekli olmalı.
 * İdeal: tek kanonik host (middleware 308) + tek redirect satırı.
 */
export function getApiAuthCallbackUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const o = window.location.origin;
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const h = new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
      if (h !== window.location.hostname) {
        console.warn(
          "[auth] Site hostu (",
          window.location.hostname,
          ") ile NEXT_PUBLIC_APP_URL hostu (",
          h,
          ") farklı; code_exchange hatalarında önce tekil domain + Supabase Redirect URL listesini kontrol edin.",
        );
      }
    } catch {
      /* yoksay */
    }
  }
  return `${o}/api/auth/callback`;
}
