"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Handshake } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";
import { csrfHeader, mintCsrfToken } from "@/lib/mint-csrf-client";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

/**
 * Teacher-facing form to submit a bid on a student listing.
 *
 * Flow:
 *   1. Teacher enters a price and optional note.
 *   2. We warn once with the credit cost + max-4 cap.
 *   3. POST /listings/[id]/offers → server deducts 1 credit and
 *      writes the offer row (transactional). On 402 we bounce the
 *      teacher to the credits page.
 */
export function OfferForm({
  listingId,
  budgetMin,
  budgetMax,
}: {
  listingId: number;
  budgetMin: number | null;
  budgetMax: number | null;
}) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);

  const priceNum = Number(price);
  const priceOk = Number.isFinite(priceNum) && priceNum > 0;

  const handleOpenConfirm = () => {
    if (!priceOk || submitting) return;
    setCreditDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!priceOk || submitting) return;
    setCreditDialogOpen(false);
    setSubmitting(true);
    try {
      const token = await mintCsrfToken();
      if (!token) {
        toast.error("Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar dene.");
        return;
      }
      const res = await fetch(
        `/api/private-lesson/listings/${listingId}/offers`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...csrfHeader(token),
          },
          body: JSON.stringify({
            priceProposal: Math.round(priceNum),
            note: note.trim() || null,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));

      if (res.status === 402) {
        toast.error(
          data.error || "Yetersiz kredi. Kredi satın alın ve tekrar deneyin.",
        );
        router.push("/private-lesson/credits");
        return;
      }
      if (!res.ok) {
        toast.error(data.error || "Teklif gönderilemedi");
        return;
      }

      const chatId = typeof data.chatId === "number" ? data.chatId : null;
      toast.success(
        "Teklif gönderildi! Sohbet açıldı; öğrenci onayı beklemeden mesaj atabilirsin.",
      );
      if (chatId) {
        router.push(`/private-lesson/messages/${chatId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      clientLogger.error({
        message: "submit offer failed",
        error,
        location: "OfferForm/handleSubmit",
      });
      toast.error("Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const creditHint = formatBudgetHint(budgetMin, budgetMax, priceNum);
  const creditDescription = (
    <>
      <span className="block mb-2">
        Teklif göndermek <span className="font-semibold">1 kredi</span> kullanır.
        Ödeme sonrası kredi iade edilmez; sohbet açılır ve öğrenci kabulünü
        beklemeden mesaj yazabilirsin.
      </span>
      <span className="block text-gray-700 mb-2">
        Onayladığında, sohbet üzerinden{" "}
        <span className="font-semibold">
          öğrencinin kayıtlı e-posta ve telefon bilgilerine
        </span>{" "}
        erişirsin; senin kayıtlı e-posta ve telefon bilgilerin de öğrenciyle
        paylaşılır. İletişim bilgilerinin doğru olduğundan emin ol.
      </span>
      {creditHint ? (
        <span className="block text-amber-800">{creditHint}</span>
      ) : null}
    </>
  );

  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Handshake className="h-5 w-5 text-emerald-600" />
        <h2 className="font-semibold text-gray-900">Teklif Ver</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        1 kredi ile teklif gönderirsin. Öğrenci kabulünü beklemeden sohbet açılır;
        tarafların kayıtlı e-posta ve telefon bilgileri sohbet içinde paylaşılır.
        İlana en fazla 4 teklif düşer; kredi iade edilmez.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Saatlik Fiyat Teklifi (₺) *
          </label>
          <input
            type="number"
            min={1}
            max={100000}
            step={10}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={
              budgetMin != null && budgetMax != null
                ? `Öğrenci bütçesi: ${budgetMin}–${budgetMax}`
                : "Örn. 400"
            }
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Not (opsiyonel)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Ders yaklaşımın, deneyimin, müsait olduğun saatler vb."
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 resize-none"
          />
          <div className="text-[10px] text-gray-400 mt-1 text-right">
            {note.length}/500
          </div>
        </div>

        <Button
          onClick={handleOpenConfirm}
          disabled={!priceOk || submitting}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Gönderiliyor...
            </>
          ) : (
            "Teklifi Gönder (1 kredi)"
          )}
        </Button>
      </div>
      <ConfirmActionDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        title="Kullanımı onayla"
        description={creditDescription}
        confirmLabel="Evet, 1 kredi kullan"
        cancelLabel="Vazgeç"
        confirmVariant="primary"
        pending={submitting}
        onConfirm={handleSubmit}
      />
    </div>
  );
}

function formatBudgetHint(
  min: number | null,
  max: number | null,
  price: number,
): string | null {
  if (min != null && price < min) {
    return `Fiyatın öğrenci bütçesinin altında (min ${min}₺).`;
  }
  if (max != null && price > max) {
    return `Fiyatın öğrenci bütçesinin üstünde (max ${max}₺).`;
  }
  return null;
}
