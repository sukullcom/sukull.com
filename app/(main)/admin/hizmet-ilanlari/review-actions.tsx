"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { approveServiceRequest, rejectServiceRequest } from "@/actions/admin-marketplace";
import { Button } from "@/components/ui/button";

const QUICK_NOTES = [
  "İletişim bilgisi açıklamada paylaşılmış.",
  "Açıklama yetersiz, ihtiyacını biraz daha detaylı yaz.",
  "Hizmet kategorisi yanlış seçilmiş.",
  "Uygunsuz içerik.",
];

export function ReviewActions({ requestId, status }: { requestId: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  const canApprove = status === "pending" || status === "rejected";
  const canReject = status === "pending" || status === "open";

  async function approve() {
    setBusy("approve");
    const result = await approveServiceRequest(requestId);
    setBusy(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("İlan yayına alındı.");
    router.refresh();
  }

  async function reject() {
    setBusy("reject");
    const result = await rejectServiceRequest(requestId, note);
    setBusy(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("İlan reddedildi.");
    setRejecting(false);
    setNote("");
    router.refresh();
  }

  if (!canApprove && !canReject) return <span className="text-xs text-gray-400">—</span>;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-1.5">
        {canApprove && (
          <Button type="button" size="sm" variant="primaryOutline" className="h-8 text-xs" disabled={busy !== null} onClick={approve}>
            {busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="mr-1 h-3.5 w-3.5" />Onayla</>}
          </Button>
        )}
        {canReject && !rejecting && (
          <Button type="button" size="sm" variant="danger" className="h-8 text-xs" disabled={busy !== null} onClick={() => setRejecting(true)}>
            <X className="mr-1 h-3.5 w-3.5" />
            Reddet
          </Button>
        )}
      </div>
      {rejecting && (
        <div className="w-72 space-y-2 rounded-xl border border-red-200 bg-red-50 p-2 text-left">
          <p className="text-xs font-semibold text-red-900">Reddetme nedeni (müşteri görür)</p>
          <div className="flex flex-wrap gap-1">
            {QUICK_NOTES.map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-lg border border-red-200 bg-white px-2 py-1 text-[11px] text-red-900 hover:bg-red-100"
                onClick={() => setNote(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Kısa bir not yaz"
            className="w-full rounded-lg border border-red-200 bg-white p-2 text-xs outline-none focus:border-red-400"
          />
          <div className="flex justify-end gap-1.5">
            <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setRejecting(false)} disabled={busy !== null}>
              Vazgeç
            </Button>
            <Button type="button" size="sm" variant="danger" className="h-8 text-xs" onClick={reject} disabled={busy !== null || note.trim().length < 3}>
              {busy === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reddet"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
