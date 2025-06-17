"use client";

import { useState } from "react";
import { X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReviewLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  teacherId: string;
  teacherName: string;
  lessonDate: string;
  onReviewSubmitted: (review: any) => void;
}

export const ReviewLessonModal = ({
  isOpen,
  onClose,
  bookingId,
  teacherId,
  teacherName,
  lessonDate,
  onReviewSubmitted
}: ReviewLessonModalProps) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Lütfen bir puan verin (1-5 yıldız)");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/private-lesson/submit-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      
      // Call the callback to update the parent component
      onReviewSubmitted({
        id: result.review.id,
        rating,
        comment: comment.trim() || null,
        createdAt: new Date().toISOString(),
      });

      toast.success("Değerlendirmeniz başarıyla gönderildi!");
      
      // Reset form
      setRating(0);
      setComment("");
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starRating = i + 1;
      return (
        <button
          key={i}
          type="button"
          onClick={() => handleStarClick(starRating)}
          className="focus:outline-none transition-colors"
        >
          <Star
            className={`h-8 w-8 ${
              starRating <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          />
        </button>
      );
    });
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return "Çok Kötü";
      case 2: return "Kötü";
      case 3: return "Orta";
      case 4: return "İyi";
      case 5: return "Mükemmel";
      default: return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Dersi Değerlendir</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Öğretmen: {teacherName}</h3>
            <p className="text-sm text-gray-600">Ders Tarihi: {lessonDate}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dersi nasıl değerlendiriyorsunuz? <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center justify-center gap-1 mb-2">
              {renderStars()}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-medium text-gray-700">
                {getRatingLabel(rating)} ({rating}/5)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yorum (İsteğe bağlı)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ders hakkındaki düşüncelerinizi paylaşın..."
              className="min-h-[100px]"
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 karakter
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                Gönderiliyor...
              </>
            ) : (
              "Değerlendirmeyi Gönder"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}; 