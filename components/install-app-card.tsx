"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Download, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getCapturedDeferred,
  isInstalled as isPwaInstalled,
  isIosDevice,
  subscribeInstalled,
  subscribeReady,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";

/**
 * Mağaza'da "Sukull'u uygulama olarak yükle" kartı.
 *
 * Üç olası durum:
 *  1) **Yüklü** (standalone veya `appinstalled` fired):
 *     buton "Yüklendi" olarak disabled gösterilir.
 *  2) **Yüklenebilir** (Chromium tarayıcı `beforeinstallprompt` fire ettiyse):
 *     buton aktif, tıklayınca tarayıcının native prompt'u açılır. "Daha
 *     sonra" cooldown'unu (30 gün) **dikkate almaz** — kullanıcı Mağaza'ya
 *     bilerek geldiyse niyeti net.
 *  3) **iOS Safari** (beforeinstallprompt fire etmez):
 *     buton "Ana ekrana ekle" diyerek talimat modalı açar (Paylaş ikonu).
 *  4) **Diğer (desktop Firefox, Safari macOS vs.)**: yükleme desteklenmiyor
 *     mesajı + URL kopyala düğmesi (ileride; şimdilik gizli).
 */
export function InstallAppCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(false);
  const [ios, setIos] = useState<boolean>(false);
  const [showIosHelp, setShowIosHelp] = useState<boolean>(false);

  useEffect(() => {
    setIos(isIosDevice());
    setInstalled(isPwaInstalled());

    setDeferred(getCapturedDeferred());

    const unsubReady = subscribeReady((e) => setDeferred(e));
    const unsubInstalled = subscribeInstalled(() => {
      setInstalled(true);
      setDeferred(null);
    });

    return () => {
      unsubReady();
      unsubInstalled();
    };
  }, []);

  const install = useCallback(async () => {
    if (ios) {
      setShowIosHelp(true);
      return;
    }
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setDeferred(null);
      }
    } catch {
      /* user dismissed / browser blocked */
    }
  }, [deferred, ios]);

  // Hiçbir koşulda buton anlamlı değilse kartı gösterme — boş yere yer
  // tutmasın. (Yüklü ise gösteriyoruz; teyit için.)
  const canPromptNow = installed || ios || deferred != null;
  if (!canPromptNow) return null;

  return (
    <div className="flex items-center w-full p-4 gap-x-4 border-t-2">
      <div className="flex items-center justify-center w-[60px] h-[60px] shrink-0">
        {installed ? (
          <CheckCircle2 className="h-10 w-10 text-suk-brand" />
        ) : (
          <Smartphone className="h-10 w-10 text-suk-brand" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-base lg:text-xl font-bold">
          {installed
            ? "Uygulama yüklü"
            : "Sukull'u uygulama olarak yükle"}
        </p>
        <p className="text-muted-foreground text-sm">
          {installed
            ? "Sukull cihazına yüklü. Doğrudan ana ekrandaki simgeden açabilirsin."
            : ios
              ? "Safari ile aç → Paylaş ikonuna dokun → Ana Ekrana Ekle."
              : "Daha hızlı erişim ve çevrimdışı ipuçları için tek tıkla yükle."}
        </p>
      </div>
      <Button
        type="button"
        variant={installed ? "muted" : "primary"}
        onClick={installed ? undefined : install}
        disabled={installed}
      >
        {installed ? (
          "Yüklendi"
        ) : ios ? (
          "Nasıl?"
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Yükle
          </>
        )}
      </Button>

      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sukull&apos;u ana ekrana ekle</DialogTitle>
            <DialogDescription>
              iPhone / iPad&apos;de Safari ile şu adımları izle:
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground">
            <li>
              Bu sayfayı <strong>Safari</strong> ile aç (Chrome / Edge &quot;Ana
              Ekrana Ekle&quot; desteklemez).
            </li>
            <li>
              Adres çubuğunun yanındaki <strong>Paylaş</strong> ikonuna dokun
              (yukarı oklu kutu).
            </li>
            <li>
              Açılan listede <strong>Ana Ekrana Ekle</strong>&apos;ya dokun.
            </li>
            <li>
              <strong>Ekle</strong> butonuyla tamamla — Sukull simgesi
              ana ekrana gelir.
            </li>
          </ol>
          <Button
            type="button"
            variant="primary"
            className="w-full mt-3"
            onClick={() => setShowIosHelp(false)}
          >
            Anladım
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
