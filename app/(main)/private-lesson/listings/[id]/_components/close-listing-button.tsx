"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Loader2, XCircle } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";

/**
 * Student-owned "Kapat" button. Closes the listing so no new offers
 * can come in. Existing pending offers stay as-is (student may still
 * want to accept one of them later via /my-listings, though the
 * current UI closes on accept too).
 */
export function CloseListingButton({ listingId }: { listingId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const doClose = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/private-lesson/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "İlan kapatılamadı");
        return;
      }
      toast.success("İlan kapatıldı");
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      clientLogger.error({
        message: "close listing failed",
        error,
        location: "CloseListingButton/doClose",
      });
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        disabled={loading}
        variant="dangerOutline"
        size="sm"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <XCircle className="h-3.5 w-3.5 mr-1" />
        )}
        İlanı Kapat
      </Button>
      <ConfirmActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="İlanı kapat?"
        description="Kapatıldıktan sonra bu ilan için yeni teklif gelmez. Mevcut tekliflere aynı ekrandan devam edebilirsin."
        confirmLabel="Evet, kapat"
        cancelLabel="Vazgeç"
        confirmVariant="danger"
        pending={loading}
        onConfirm={doClose}
        imageSrc="/mascot_sad.svg"
        imageAlt="Onay"
      />
    </>
  );
}
