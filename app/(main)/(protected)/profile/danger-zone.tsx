"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteMyAccount } from "@/actions/account";
import { reportClientError } from "@/lib/report-error";

interface DangerZoneProps {
  /**
   * The user's current username. The dialog requires the user to type this
   * verbatim before the delete button unlocks — catches accidental clicks
   * and confirms they know *which* account they're deleting.
   */
  username: string;
}

/**
 * Danger zone card for the profile settings tab.
 *
 * Kept in its own file (and its own component) because:
 *   1. It's only rendered inside a tab the user actively navigates to,
 *      so the dialog code can be code-split away from the initial profile
 *      bundle via `next/dynamic` at the import site.
 *   2. The confirm-to-type UX is complex enough that inlining it into
 *      `profile-page-client.tsx` (already 23KB) would hurt readability.
 *
 * Actual deletion runs on the server (`deleteMyAccount` server action),
 * which handles cascade deletes, auth-user removal, and sign-out. On
 * success we hard-navigate to `/` so the cached RSC tree is dropped.
 */
export function DangerZone({ username }: DangerZoneProps) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, startTransition] = useTransition();

  const canSubmit = confirmation.trim() === username && !pending;

  const onDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteMyAccount(confirmation);
        if (result.ok) {
          toast.success("Hesabınız kalıcı olarak silindi.");
          // Hard redirect so middleware re-evaluates with no session and
          // the in-memory RSC cache is dropped on the next render.
          window.location.assign("/?deleted=1");
          return;
        }

        switch (result.code) {
          case "confirmation_mismatch":
            toast.error("Kullanıcı adı eşleşmiyor. Lütfen tam olarak yazın.");
            break;
          case "rate_limited":
            toast.error("Çok fazla deneme. Lütfen daha sonra tekrar deneyin.");
            break;
          case "unauthenticated":
            toast.error("Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.");
            break;
          case "unknown_user":
            toast.error("Kullanıcı bulunamadı.");
            break;
          default:
            toast.error("Hesap silinirken beklenmeyen bir hata oluştu.");
        }
      } catch (err) {
        reportClientError({ error: err, location: "profile/danger-zone/delete" });
        toast.error("Bağlantı hatası. Lütfen tekrar deneyin.");
      }
    });
  };

  return (
    <div className="pt-4 border-t border-gray-200">
      <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">
        Tehlikeli Bölge
      </h3>

      <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-red-100 p-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">Hesabı Sil</p>
            <p className="mt-1 text-xs text-red-800/80">
              Hesabınız ve size ait tüm veriler kalıcı olarak silinir. Bu
              işlem geri alınamaz. KVKK kapsamındaki unutulma hakkınız
              doğrultusunda çalışır.
            </p>

            <Dialog
              open={open}
              onOpenChange={(next) => {
                if (pending) return;
                setOpen(next);
                if (!next) setConfirmation("");
              }}
            >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  disabled={pending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hesabımı kalıcı olarak sil
                </button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-red-700">
                    Hesabınızı silmek istediğinize emin misiniz?
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Bu işlem geri alınamaz. Kullanıcı adınız, puanlarınız,
                    ders ilerlemeniz, bildirimleriniz, ödeme geçmişiniz ve
                    size ait tüm kişisel kayıtlar kalıcı olarak silinir.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Onaylamak için kullanıcı adınızı yazın:
                    <span className="ml-1 font-semibold">{username}</span>
                  </p>
                  <Input
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="kullanıcı adı"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={pending}
                    aria-label="Kullanıcı adı doğrulama"
                  />
                </div>

                <DialogFooter className="gap-2 sm:justify-end">
                  <DialogClose asChild>
                    <Button type="button" variant="default" disabled={pending}>
                      Vazgeç
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={onDelete}
                    disabled={!canSubmit}
                  >
                    {pending ? "Siliniyor..." : "Evet, hesabımı sil"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
