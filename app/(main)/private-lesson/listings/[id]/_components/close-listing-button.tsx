"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

  const handleClick = async () => {
    if (
      !window.confirm(
        "İlanı kapatmak istediğine emin misin? Kapatıldıktan sonra yeni teklif gelmez.",
      )
    )
      return;

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
      router.refresh();
    } catch (error) {
      clientLogger.error({
        message: "close listing failed",
        error,
        location: "CloseListingButton/handleClick",
      });
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
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
  );
}
