"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";

type Props = {
  listingId: number;
};

export function ListingModerationActions({ listingId }: Props) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  async function patch(action: "approve" | "reject") {
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message || "İşlem başarısız");
        return;
      }
      toast.success(
        action === "approve" ? "İlan yayına alındı." : "İlan reddedildi.",
      );
      window.location.reload();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="primaryOutline"
        disabled={busy !== null}
        onClick={() => patch("approve")}
        className="h-8 text-xs"
      >
        {busy === "approve" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <Check className="h-3.5 w-3.5 mr-1" />
            Onayla
          </>
        )}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="danger"
        disabled={busy !== null}
        onClick={() => patch("reject")}
        className="h-8 text-xs"
      >
        {busy === "reject" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <X className="h-3.5 w-3.5 mr-1" />
            Reddet
          </>
        )}
      </Button>
    </div>
  );
}
