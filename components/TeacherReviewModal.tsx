"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";
import { mintCsrfToken, csrfHeader } from "@/lib/mint-csrf-client";

const MAX_COMMENT = 500;

type Props = {
  teacherId: string;
  teacherName?: string;
  suggestedOfferId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
};

export function TeacherReviewModal({
  teacherId,
  teacherName,
  suggestedOfferId,
  open,
  onOpenChange,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState<number>(8);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await mintCsrfToken();
      if (!token) {
        toast.error("Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar dene.");
        return;
      }

      const body: Record<string, unknown> = { rating, comment: comment.trim() || undefined };
      if (suggestedOfferId != null) {
        body.offerId = suggestedOfferId;
      }

      const res = await fetch(`/api/teachers/${encodeURIComponent(teacherId)}/review`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeader(token),
        },
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.status === 201) {
        toast.success("Geri bildirimin kaydedildi. Teşekkürler!");
        onOpenChange(false);
        setComment("");
        onSubmitted?.();
        return;
      }
      if (res.status === 409) {
        toast.error(data.error || "Zaten değerlendirme gönderdin.");
        onOpenChange(false);
        onSubmitted?.();
        return;
      }
      if (res.status === 403) {
        toast.error(data.error || "Bu değerlendirmeyi gönderemezsin.");
        return;
      }
      toast.error(data.error || "Gönderilemedi.");
    } catch (err) {
      clientLogger.error({
        message: "teacher review submit failed",
        error: err,
        location: "TeacherReviewModal/handleSubmit",
      });
      toast.error("Gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eğitmene geri bildirim</DialogTitle>
          <p className="text-sm text-gray-600 text-left font-normal">
            {teacherName ? (
              <>
                <span className="font-medium text-gray-900">{teacherName}</span> için
                tek seferlik değerlendirme. Puan 1–10 arası; yorum isteğe bağlı.
              </>
            ) : (
              <>Tek seferlik değerlendirme. Puan 1–10 arası; yorum isteğe bağlı.</>
            )}
          </p>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-gray-700">Puan: {rating}/10</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`h-9 min-w-[2.25rem] rounded-md border text-sm font-medium transition-colors ${
                    rating === n
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-green-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="review-comment" className="text-gray-700">
              Yorum (isteğe bağlı, en fazla {MAX_COMMENT} karakter)
            </Label>
            <Textarea
              id="review-comment"
              value={comment}
              maxLength={MAX_COMMENT}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-1.5 resize-none"
              placeholder="Kısa bir yorum yazabilirsin…"
            />
            <div className="text-[11px] text-gray-400 mt-1 text-right">
              {comment.length}/{MAX_COMMENT}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="secondaryOutline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Vazgeç
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Gönderiliyor
              </>
            ) : (
              "Gönder"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
