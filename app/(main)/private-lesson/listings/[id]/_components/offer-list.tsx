"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, MessageCircle } from "lucide-react";
import { normalizeAvatarUrl } from "@/utils/avatar";
import { clientLogger } from "@/lib/client-logger";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

type Offer = {
  id: number;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string | null;
  priceProposal: number;
  note: string | null;
  status: "pending" | "withdrawn" | "accepted" | "rejected";
  createdAt: string;
};

/**
 * Student-facing list of offers on a listing they own. They can
 * accept (closes the listing + auto-rejects the rest) or reject a
 * single offer. Accepted teacher surfaces a "Mesaj Gönder" CTA so the
 * student can continue the conversation — the listing flow hands off
 * to the existing message-unlock flow (separate 1-credit charge from
 * the student side).
 */
export function OfferList({
  offers,
  listingStatus,
}: {
  offers: Offer[];
  listingStatus: "open" | "closed" | "expired";
}) {
  const router = useRouter();
  const [pending, setPending] = useState<Record<number, boolean>>({});
  const [confirm, setConfirm] = useState<{
    offerId: number;
    action: "accept" | "reject";
  } | null>(null);

  const openConfirm = (offerId: number, action: "accept" | "reject") => {
    if (pending[offerId]) return;
    setConfirm({ offerId, action });
  };

  const runMutate = async () => {
    if (!confirm) return;
    const { offerId, action } = confirm;
    setPending((p) => ({ ...p, [offerId]: true }));
    setConfirm(null);
    try {
      const res = await fetch(`/api/private-lesson/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "İşlem başarısız");
        return;
      }
      toast.success(
        action === "accept" ? "Teklif kabul edildi" : "Teklif reddedildi",
      );
      router.refresh();
    } catch (error) {
      clientLogger.error({
        message: "mutate offer failed",
        error,
        location: "OfferList/runMutate",
      });
      toast.error("Bir hata oluştu");
    } finally {
      setPending((p) => ({ ...p, [offerId]: false }));
    }
  };

  const sorted = [...offers].sort((a, b) => {
    const rank: Record<Offer["status"], number> = {
      accepted: 0,
      pending: 1,
      rejected: 2,
      withdrawn: 3,
    };
    return rank[a.status] - rank[b.status];
  });

  const isAccept = confirm?.action === "accept";

  return (
    <div className="space-y-3">
      <ConfirmActionDialog
        open={confirm != null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={isAccept ? "Teklifi kabul ediyor musun?" : "Bu teklifi reddediyor musun?"}
        description={
          isAccept
            ? "İlanın kapanacak ve bu öğretmenin dışındaki tüm beklemedeki teklifler reddedilecek. Bu eylem geri alınamaz."
            : "Öğretmen, teklifin reddedildiğini görecek. İstediğin zaman başka bir teklif seçebilirsin."
        }
        confirmLabel={isAccept ? "Evet, kabul et" : "Evet, reddet"}
        cancelLabel="Vazgeç"
        confirmVariant={isAccept ? "primary" : "danger"}
        onConfirm={runMutate}
        imageSrc={isAccept ? "/mascot_orange.svg" : "/mascot_sad.svg"}
      />
      {sorted.map((offer) => (
        <div
          key={offer.id}
          className="bg-white border rounded-xl p-4 flex items-start gap-3"
        >
          <Image
            src={normalizeAvatarUrl(offer.teacherAvatar ?? undefined)}
            alt={offer.teacherName}
            width={44}
            height={44}
            unoptimized={offer.teacherAvatar?.startsWith("http") ?? false}
            className="rounded-full object-cover w-11 h-11 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/private-lesson/teachers/${offer.teacherId}`}
                  className="font-semibold text-gray-900 hover:text-green-700 transition-colors"
                >
                  {offer.teacherName}
                </Link>
                <div className="text-[11px] text-gray-400">
                  {new Date(offer.createdAt).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <OfferStatusBadge status={offer.status} />
            </div>

            <div className="mt-2 text-lg font-bold text-gray-900">
              {offer.priceProposal}₺ / saat
            </div>

            {offer.note && (
              <p className="mt-1.5 text-sm text-gray-700 whitespace-pre-wrap">
                {offer.note}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {offer.status === "pending" && listingStatus === "open" && (
                <>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => openConfirm(offer.id, "accept")}
                    disabled={Boolean(pending[offer.id])}
                  >
                    {pending[offer.id] ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    Kabul Et
                  </Button>
                  <Button
                    size="sm"
                    variant="primaryOutline"
                    onClick={() => openConfirm(offer.id, "reject")}
                    disabled={Boolean(pending[offer.id])}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reddet
                  </Button>
                </>
              )}
              {offer.status === "accepted" && (
                <Link
                  href={`/private-lesson/teachers/${offer.teacherId}`}
                  className="inline-flex items-center gap-1 text-sm text-green-700 font-medium hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Öğretmenle iletişime geç
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OfferStatusBadge({ status }: { status: Offer["status"] }) {
  const styles: Record<Offer["status"], string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    withdrawn: "bg-gray-100 text-gray-500",
  };
  const labels: Record<Offer["status"], string> = {
    pending: "Beklemede",
    accepted: "Kabul Edildi",
    rejected: "Reddedildi",
    withdrawn: "Geri Çekildi",
  };
  return (
    <span
      className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
