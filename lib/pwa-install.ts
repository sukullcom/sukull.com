"use client";

/**
 * Tek bir global `beforeinstallprompt` dinleyicisi — birden fazla React
 * tüketicisi (örn. ekranın altındaki sürpriz banner + Mağaza'daki "Uygulama
 * olarak yükle" kartı) ortak duruma erişebilsin.
 *
 * Notlar:
 *  - `beforeinstallprompt` React mount edilmeden önce de fire olabilir;
 *    bu yüzden modül import edilir edilmez dinleyiciyi attach ediyoruz
 *    (`attachGlobalInstallListener` idempotent).
 *  - "Daha sonra" (30 gün) süresince banner kapalı kalır; ama Mağaza
 *    kartı bu cooldown'ı **dikkate almaz** — kullanıcı oraya bilerek
 *    geldiyse, ona kısıtlama uygulamamak doğal.
 *  - iOS Safari `beforeinstallprompt` event'i fire etmez. iOS'ta button
 *    talimat modalı açar (Paylaş → Ana Ekrana Ekle).
 *  - `appinstalled` event fire olduğunda capturedDeferred temizlenir ve
 *    state "installed" olur.
 */

/** Standart dışı ama Chromium'da var. */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const PWA_DISMISS_KEY = "sukull-pwa-install-dismissed-at";
export const PWA_DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

let capturedDeferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const readySubscribers = new Set<(event: BeforeInstallPromptEvent) => void>();
const installedSubscribers = new Set<() => void>();
let globalListenerAttached = false;

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ Safari masaüstü UA döndürüyor; touch ile ayırt ediyoruz.
  if (
    ua.includes("Macintosh") &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1
  ) {
    return true;
  }
  return false;
}

export function hasDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(PWA_DISMISS_KEY);
    if (!raw) return false;
    const t = Number(raw);
    if (!Number.isFinite(t)) return false;
    return Date.now() - t <= PWA_DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function markDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PWA_DISMISS_KEY, String(Date.now()));
  } catch {
    /* private mode / quota */
  }
}

export function getCapturedDeferred(): BeforeInstallPromptEvent | null {
  return capturedDeferred;
}

export function isInstalled(): boolean {
  return installed || isStandaloneMode();
}

export function subscribeReady(
  cb: (event: BeforeInstallPromptEvent) => void,
): () => void {
  readySubscribers.add(cb);
  return () => {
    readySubscribers.delete(cb);
  };
}

export function subscribeInstalled(cb: () => void): () => void {
  installedSubscribers.add(cb);
  return () => {
    installedSubscribers.delete(cb);
  };
}

/**
 * `beforeinstallprompt`u tüketince üçe ayrılır:
 *  • shouldSuppressNative=true (banner cooldown'da değilse): preventDefault
 *    çağrılır, native menü saklı tutulur, biz kendi UI'mızı göstereceğiz.
 *  • shouldSuppressNative=false: preventDefault çağrılmaz — kullanıcı
 *    banner'ı 30 gün önce kapadıysa native install ikonu tarayıcıda kalmalı.
 *  • Her durumda event'i `capturedDeferred`a yerleştirip subscriber'ları
 *    uyarıyoruz; çünkü kullanıcı bu sırada Mağaza'ya gidip butona basabilir.
 *    `event.prompt()`u native menü engellenmemiş olsa bile çağırabiliriz —
 *    spec gereği yine kullanıcı diyalogu açılır.
 */
export function attachGlobalInstallListener(): void {
  if (globalListenerAttached || typeof window === "undefined") return;
  globalListenerAttached = true;

  window.addEventListener("beforeinstallprompt", (event: Event) => {
    const bip = event as BeforeInstallPromptEvent;
    // Banner cooldown'da değilse native prompt'u biz tetikleyeceğiz.
    if (!hasDismissedRecently() && !isStandaloneMode()) {
      event.preventDefault();
    }
    capturedDeferred = bip;
    readySubscribers.forEach((cb) => cb(bip));
  });

  window.addEventListener("appinstalled", () => {
    capturedDeferred = null;
    installed = true;
    installedSubscribers.forEach((cb) => cb());
  });
}

attachGlobalInstallListener();
