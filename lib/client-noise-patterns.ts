/**
 * Bilinen client-side gürültü desenleri.
 *
 * `window.onerror` ve `unhandledrejection` tarayıcı genelinde her şeyi
 * yakalar — bizim kodumuz olmayanlar dâhil. Aşağıdaki imzalar bilinen,
 * tekrar tekrar görülen, operasyona hiçbir değer üretmeyen olaylar:
 *
 *   - **In-app browser script enjeksiyonu**: Instagram / Facebook /
 *     TikTok / Pinterest in-app browser'ları sayfaya kendi JS'lerini
 *     enjekte eder ve native köprüye (`window.webkit.messageHandlers`,
 *     Android `iabjs://…`) erişmeye çalışır. Sekme kapanırken native
 *     köprü yok edilince "Java object is gone" patlar — uygulama hatası değil.
 *   - **Tarayıcı eklentileri**: uBlock, Honey, çeviri eklentileri vb.
 *     sayfa DOM'unu manipüle ederken hata atabilir; stack'te
 *     `chrome-extension://` / `moz-extension://` / `safari-*` imzası.
 *   - **"Script error."**: Cross-origin script hata fırlattığında
 *     tarayıcının verdiği jenerik mesaj. Detay yok, aksiyon yok.
 *   - **"ResizeObserver loop …"**: Spec'e göre belirsiz; uygulamayı
 *     etkilemiyor, sadece Chrome'un agresif uyarısı.
 *   - **"Non-Error promise rejection captured"**: 3. parti SDK'ların
 *     hatalı `reject(...)` çağrılarından kaynaklanan Sentry-style noise.
 *
 * Hem client-side fetch göndermeden önce (`lib/report-error.ts`), hem
 * server-side `/api/errors` route'unda kullanılır; defense-in-depth.
 *
 * Yeni bir gürültü deseni gözlemlendiğinde, gerçek bir kullanıcı hatasını
 * yutmayacak kadar dar olduğundan emin olarak buraya eklenir.
 */

export const CLIENT_NOISE_MESSAGE_PATTERNS: RegExp[] = [
  /window\.webkit\.messageHandlers/i,
  /webkit\s*\.\s*messageHandlers/i,
  /messageHandlers\.[a-z_]+\.postMessage/i,
  /\bFB_IAB\b/,
  /\bInstagramJS\b/i,
  /\bUCShellJava\b/,
  /^Script error\.?$/i,
  /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i,
  /Non-Error promise rejection captured/i,
  /Java(Script)? exception was raised during the execution of a JS bridge/i,
  /undefined is not an object \(evaluating 'window\.webkit/i,
  /Java object is gone/i,
  /Error invoking (postMessage|enableButtonsClickedMetaDataLogging|enableDidUserTypeOnKeyboardLogging)/i,
];

export const CLIENT_NOISE_STACK_PATTERNS: RegExp[] = [
  /chrome-extension:\/\//,
  /moz-extension:\/\//,
  /safari-extension:\/\//,
  /safari-web-extension:\/\//,
  /iabjs:\/\//i,
  /navigation_performance_logger_android/i,
];

export const CLIENT_NOISE_FILENAME_PATTERNS: RegExp[] = [
  /^iabjs:\/\//i,
];

export function isClientNoise(
  message: string | null | undefined,
  stack: string | null | undefined,
  filename?: string | null | undefined,
): boolean {
  if (message) {
    for (const re of CLIENT_NOISE_MESSAGE_PATTERNS) {
      if (re.test(message)) return true;
    }
  }
  if (stack) {
    for (const re of CLIENT_NOISE_STACK_PATTERNS) {
      if (re.test(stack)) return true;
    }
  }
  if (filename) {
    for (const re of CLIENT_NOISE_FILENAME_PATTERNS) {
      if (re.test(filename)) return true;
    }
  }
  return false;
}
