"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * BeforeInstallPromptEvent is not in the TS DOM lib. Declaring the narrow
 * shape we actually consume keeps the component typed without pulling a
 * third-party typings package.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "sukull-pwa-install-dismissed-at";
// Re-show the prompt 30 days after the user dismisses it. Installs are a
// long-term gain, but nagging every session erodes trust.
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

function shouldShowAfterDismiss(): boolean {
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

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't offer install if already running in standalone mode.
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const handler = (event: Event) => {
      event.preventDefault();
      if (!shouldShowAfterDismiss()) return;
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore private-mode storage errors */
    }
    setVisible(false);
    setDeferred(null);
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
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
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-lime-200 bg-white p-4 shadow-2xl md:bottom-6 md:right-6 md:left-auto md:mx-0"
    >
      <button
        type="button"
        aria-label="Kapat"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-lime-100 text-lime-700">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 id="pwa-install-title" className="text-sm font-bold text-slate-900">
            Sukull&apos;u ana ekrana ekle
          </h2>
          <p className="mt-1 text-xs text-slate-600">
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
