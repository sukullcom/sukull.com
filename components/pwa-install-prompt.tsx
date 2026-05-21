"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BRAND_MASCOT_PATH } from "@/lib/brand-mascot";

/**
 * BeforeInstallPromptEvent is not in the TS DOM lib.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "sukull-pwa-install-dismissed-at";
/** «Daha sonra» sonrası kendi banner'ımızı sakla; tarayıcı menüsü engellenmez. */
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function shouldShowCustomBanner(): boolean {
  if (isStandaloneMode()) return false;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return true;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return true;
    return Date.now() - dismissedAt > DISMISS_COOLDOWN_MS;
  } catch {
    return true;
  }
}

/**
 * Tek global dinleyici — React mount'tan önce gelen `beforeinstallprompt` kaçmasın.
 * `preventDefault` yalnızca kendi banner'ımızı göstereceğimizde çağrılır; «Daha sonra»
 * (30 gün) süresince tarayıcının yerleşik yükle teklifi serbest kalır.
 */
let capturedDeferred: BeforeInstallPromptEvent | null = null;
const readySubscribers = new Set<(event: BeforeInstallPromptEvent) => void>();
let globalListenerAttached = false;

function notifyReady(event: BeforeInstallPromptEvent) {
  readySubscribers.forEach((cb) => cb(event));
}

function attachGlobalInstallListener() {
  if (globalListenerAttached || typeof window === "undefined") return;
  globalListenerAttached = true;

  window.addEventListener("beforeinstallprompt", (event: Event) => {
    if (!shouldShowCustomBanner()) return;
    event.preventDefault();
    const bip = event as BeforeInstallPromptEvent;
    capturedDeferred = bip;
    notifyReady(bip);
  });

  window.addEventListener("appinstalled", () => {
    capturedDeferred = null;
  });
}

attachGlobalInstallListener();

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) return;

    const onReady = (event: BeforeInstallPromptEvent) => {
      setDeferred(event);
      setVisible(true);
    };

    readySubscribers.add(onReady);

    if (capturedDeferred && shouldShowCustomBanner()) {
      onReady(capturedDeferred);
    }

    const onInstalled = () => {
      capturedDeferred = null;
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      readySubscribers.delete(onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode */
    }
    capturedDeferred = null;
    setVisible(false);
    setDeferred(null);
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        capturedDeferred = null;
        setVisible(false);
        setDeferred(null);
      } else {
        dismiss();
      }
    } catch {
      dismiss();
    }
  };

  if (!visible || !deferred) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-lime-200 bg-card p-4 shadow-2xl md:bottom-6 md:right-6 md:left-auto md:mx-0"
    >
      <button
        type="button"
        aria-label="Kapat"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <Image
          src={BRAND_MASCOT_PATH}
          alt=""
          width={40}
          height={40}
          className="mt-0.5 h-10 w-10 flex-none object-contain"
        />
        <div className="flex-1">
          <h2 id="pwa-install-title" className="text-sm font-bold text-foreground">
            Sukull&apos;u ana ekrana ekle
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Daha hızlı erişim için Sukull&apos;u uygulama olarak yükle. Çevrimdışı bazı özellikler
            de kullanılabilir hâle gelir.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="primary" onClick={install}>
              Yükle
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Daha sonra
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
