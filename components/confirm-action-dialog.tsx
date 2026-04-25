"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type ConfirmActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /** Tamamlanana kadar onay düğmesinde spinner. */
  pending?: boolean;
  /** Onay: yeşil birincil; danger: yıkıcı işlemler (ör. kapat, reddet). */
  confirmVariant?: "primary" | "danger";
  /** Ders/çıkış modallarıyla uyum: üstte maskot (opsiyonel). */
  imageSrc?: string;
  imageAlt?: string;
};

/**
 * Ders / ExitModal ile aynı dialog kalıbı: beyaz kutu, ortalanmış maskot, iki düğme.
 * Tarayıcı `window.confirm` yerine kullanılır.
 */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Tamam",
  cancelLabel = "Vazgeç",
  onConfirm,
  pending = false,
  confirmVariant = "primary",
  imageSrc = "/mascot_orange.svg",
  imageAlt = "Maskot",
}: ConfirmActionDialogProps) {
  const confirmBtnVariant = confirmVariant === "danger" ? "danger" : "primary";
  const cancelBtnVariant = "default";

  const run = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          {imageSrc ? (
            <div className="flex w-full items-center justify-center mb-2">
              <Image src={imageSrc} alt={imageAlt} height={80} width={80} />
            </div>
          ) : null}
          <DialogTitle className="text-center font-bold text-2xl">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-base text-foreground/90">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mb-1 sm:justify-stretch sm:gap-0">
          <div className="flex w-full flex-col gap-3">
            <Button
              type="button"
              variant={confirmBtnVariant}
              className="w-full"
              size="lg"
              disabled={pending}
              onClick={() => void run()}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                confirmLabel
              )}
            </Button>
            <Button
              type="button"
              variant={cancelBtnVariant}
              className="w-full"
              size="lg"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
