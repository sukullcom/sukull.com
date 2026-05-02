"use client";

import { useCallback, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeacherReviewModal } from "@/components/TeacherReviewModal";
import { clientLogger } from "@/lib/client-logger";

export type ReviewItem = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  studentLabel: string;
};

type Aggregate = { averageRating: number | null; reviewCount: number };

type ReviewGate = {
  canReview: boolean;
  alreadyReviewed: boolean;
  suggestedOfferId: number | null;
};

type Props = {
  teacherId: string;
  teacherName?: string;
  currentUserRole: string;
  isSelf: boolean;
  initialAggregate: Aggregate;
  initialReviews: ReviewItem[];
  initialNextCursor: number | null;
  reviewGate: ReviewGate | null;
  autoOpenReview?: boolean;
};

export function TeacherReviewsSection({
  teacherId,
  teacherName,
  currentUserRole,
  isSelf,
  initialAggregate,
  initialReviews,
  initialNextCursor,
  reviewGate,
  autoOpenReview,
}: Props) {
  const [aggregate, setAggregate] = useState(initialAggregate);
  const [reviews, setReviews] = useState(initialReviews);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(Boolean(autoOpenReview && reviewGate?.canReview));

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/teachers/${encodeURIComponent(teacherId)}/reviews?limit=20`,
        { credentials: "include" },
      );
      const data = (await res.json()) as {
        averageRating: number | null;
        reviewCount: number;
        reviews: ReviewItem[];
        nextCursor: number | null;
      };
      if (!res.ok) return;
      setAggregate({
        averageRating: data.averageRating,
        reviewCount: data.reviewCount,
      });
      setReviews(data.reviews ?? []);
      setNextCursor(data.nextCursor ?? null);
    } catch (e) {
      clientLogger.error({
        message: "refresh reviews failed",
        error: e,
        location: "TeacherReviewsSection/refreshList",
      });
    }
  }, [teacherId]);

  const loadMore = useCallback(async () => {
    if (nextCursor == null || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/teachers/${encodeURIComponent(teacherId)}/reviews?limit=20&cursor=${nextCursor}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as {
        reviews: ReviewItem[];
        nextCursor: number | null;
      };
      if (!res.ok) return;
      setReviews((prev) => [...prev, ...(data.reviews ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch (e) {
      clientLogger.error({
        message: "load more reviews failed",
        error: e,
        location: "TeacherReviewsSection/loadMore",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [teacherId, nextCursor, loadingMore]);

  const showReviewCta =
    !isSelf &&
    currentUserRole !== "teacher" &&
    currentUserRole !== "admin" &&
    reviewGate?.canReview === true;

  return (
    <section className="bg-card border rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Değerlendirmeler
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {aggregate.reviewCount === 0 ? (
              "Henüz değerlendirme yok."
            ) : (
              <>
                Ortalama{" "}
                <span className="font-semibold text-foreground">
                  {aggregate.averageRating?.toFixed(1) ?? "—"}
                </span>
                /10 ·{" "}
                <span className="font-medium text-foreground">{aggregate.reviewCount}</span> yorum
              </>
            )}
          </p>
        </div>
        {showReviewCta && (
          <Button type="button" onClick={() => setModalOpen(true)} className="shrink-0">
            Geri bildirim bırak
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">İlk değerlendirmeyi sen yazabilirsin.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {reviews.map((r) => (
            <li key={r.id} className="py-3 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {r.rating}/10
                  <span className="text-muted-foreground font-normal ml-2">{r.studentLabel}</span>
                </span>
                <time className="text-[11px] text-muted-foreground shrink-0" dateTime={r.createdAt}>
                  {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                </time>
              </div>
              {r.comment ? (
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{r.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {nextCursor != null && (
        <Button
          type="button"
          variant="secondaryOutline"
          size="sm"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="w-full sm:w-auto"
        >
          {loadingMore ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Yükleniyor
            </>
          ) : (
            "Daha fazla göster"
          )}
        </Button>
      )}

      <TeacherReviewModal
        teacherId={teacherId}
        teacherName={teacherName}
        suggestedOfferId={reviewGate?.suggestedOfferId ?? null}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmitted={() => void refreshList()}
      />
    </section>
  );
}
