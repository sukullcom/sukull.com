/**
 * Geçici ağ hatası sınıflandırıcısı (client-side).
 *
 * Tarayıcılarda `fetch` aşağıdaki *iyi huylu* durumlarda da reject olur:
 *
 *   - Kullanıcı sayfadan ayrılır / sekmeyi kapatır (browser request abort).
 *   - `AbortController` ile bilinçli iptal.
 *   - Çevrimdışı / WiFi düştü.
 *   - bfcache'ten dönüş ve yeniden start eden eski promise.
 *
 * Bunlar `error_log` tablosunda yer almak istemediğimiz "uygulama hatası
 * değil" sınıfına girer. `clientLogger.error(...)` çağrısı `reportClientError`
 * üzerinden DB'ye yazıyor; bu helper'la sınıflandırıp eşlemeleri `warn`
 * seviyesine (yalnızca console) düşürüyoruz.
 *
 * Heuristik tutucu — yanlış pozitif yapmasın diye sadece kesin imzalı
 * vakaları kapsar (TypeError: Failed to fetch + AbortError + offline).
 *
 * Diğer client error mesajları (ör. 500 dönen API, JSON parse hatası,
 * uygulama-içi exception) sınıflandırıcının dışında kalır ve normal
 * yolundan DB'ye düşmeye devam eder.
 */

const TRANSIENT_FETCH_MESSAGES = [
  "Failed to fetch", // Chromium / Edge
  "NetworkError when attempting to fetch resource", // Firefox
  "Load failed", // Safari
  "The Internet connection appears to be offline", // Safari (iOS)
  "cancelled", // bazı Safari sürümlerinde alt-tab iptali
];

export function isTransientNetworkError(error: unknown): boolean {
  // Çevrimdışıyız: her fetch hatası bu kovaya girer.
  if (
    typeof navigator !== "undefined" &&
    "onLine" in navigator &&
    navigator.onLine === false
  ) {
    return true;
  }

  if (!error) return false;

  if (typeof error === "object") {
    const e = error as { name?: unknown; message?: unknown };

    // AbortController veya navigasyon kaynaklı iptal.
    if (e.name === "AbortError") return true;

    const message = typeof e.message === "string" ? e.message : "";
    if (!message) return false;

    if (TRANSIENT_FETCH_MESSAGES.some((m) => message.includes(m))) {
      return true;
    }
  }

  if (typeof error === "string") {
    return TRANSIENT_FETCH_MESSAGES.some((m) => error.includes(m));
  }

  return false;
}

/**
 * Sayfa görünmüyorsa (tab arka planda veya unloading) çoğu transient
 * fetch hatası kullanıcıya hiç ulaşmamalı; UI'ı boş yere "hata var" moduna
 * almamak için bunu çağrıyoruz. SSR / non-browser ortamlarda `true` döner
 * — durum belirsiz, varsayılan davranışı koruyalım.
 */
export function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}
