"use client";

import { useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clientLogger } from "@/lib/client-logger";
import { toast } from "sonner";

interface ReviewData {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface ReviewLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  teacherId: string;
  teacherName: string;
  lessonDate: string;
  onReviewSubmitted: (review: ReviewData) => void;
}

export const ReviewLessonModal = ({
  isOpen,
  onClose,
  bookingId,
  teacherId,
  teacherName,
  lessonDate,
  onReviewSubmitted,
}: ReviewLessonModalProps) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Önce yıldız seçmeyi unutma!");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/private-lesson/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          teacherId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Değerlendirme gönderilemedi");
      }

      const result = await response.json();

      onReviewSubmitted({
        id: result.review.id,
        rating,
        comment: comment.trim() || null,
        createdAt: new Date().toISOString(),
      });

      toast.success("Teşekkürler, değerlendirmen kaydedildi!");
      setRating(0);
      setComment("");
      onClose();
    } catch (error) {
      clientLogger.error({ message: "submit review failed", error, location: "review-lesson-modal" });
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return "Pek değil";
      case 2: return "İdare eder";
      case 3: return "Fena değil";
      case 4: return "Bayıldım!";
      case 5: return "Efsane!";
      default: return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center w-full justify-center mb-5">
            <Image src="/mascot_orange.svg" alt="Maskot" height={80} width={80} />
          </div>
          <DialogTitle className="text-center font-bold text-2xl">
            Ders nasıldı?
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            <span className="font-medium">{teacherName}</span> ile{" "}
            <span className="font-medium">{lessonDate}</span> tarihindeki dersini puanla! Geri bildirimin çok değerli.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Star Rating */}
          <div>
            <p className="text-sm font-medium text-gray-700 text-center mb-3">
              Kaç yıldız verirsin?
            </p>
            <div className="flex items-center justify-center gap-1 mb-1">
              {Array.from({ length: 5 }, (_, i) => {
                const starRating = i + 1;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(starRating)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        starRating <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300 hover:text-amber-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-medium text-gray-600">
                {getRatingLabel(rating)} ({rating}/5)
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bir şey eklemek ister misin?
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Derste en çok neyi beğendin?"
              className="min-h-[80px] resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="mb-4">
          <div className="flex flex-col gap-y-4 w-full">
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? "Gönderiliyor..." : "Gönder!"}
            </Button>
            <Button
              variant="default"
              className="w-full"
              size="lg"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Sonra yaparım
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
