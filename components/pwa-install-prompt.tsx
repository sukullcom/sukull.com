"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BRAND_MASCOT_PATH } from "@/lib/brand-mascot";
import {
  getCapturedDeferred,
  hasDismissedRecently,
  isStandaloneMode,
  markDismissed,
  subscribeInstalled,
  subscribeReady,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) return;

    const onReady = (event: BeforeInstallPromptEvent) => {
      // Bu banner kullanıcı "Daha sonra" dediyse 30 gün gizlenir; ama
      // Mağaza'daki manuel "Uygulama olarak yükle" kartı bu cooldown'a
      // bağlı değildir (bkz. lib/pwa-install.ts).
      if (hasDismissedRecently()) return;
      setDeferred(event);
      setVisible(true);
    };

    const unsubReady = subscribeReady(onReady);

    const captured = getCapturedDeferred();
    if (captured && !hasDismissedRecently()) {
      onReady(captured);
    }

    const unsubInstalled = subscribeInstalled(() => {
      setVisible(false);
      setDeferred(null);
    });

    return () => {
      unsubReady();
      unsubInstalled();
    };
  }, []);

  const dismiss = () => {
    markDismissed();
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
