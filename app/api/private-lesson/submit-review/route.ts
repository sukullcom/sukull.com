import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { secureApi } from "@/lib/api-middleware";
import { submitLessonReview, isApprovedStudent } from "@/db/queries";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { RATE_LIMITS } from "@/lib/rate-limit-db";
import { getRequestLogger } from "@/lib/logger";

/**
 * Reviews are uniquely constrained per (bookingId, studentId) at the DB
 * layer, so the worst a rogue client can do is spam 429s. 10/hour still
 * covers the realistic case (a student reviewing many accumulated lessons
 * in one session).
 */
export const POST = secureApi.authRateLimited(
  { bucket: "review-submit", keyKind: "user", ...RATE_LIMITS.reviewSubmit },
  async (request: NextRequest, user) => {
    try {
      const isStudent = await isApprovedStudent(user.id);
      if (!isStudent) {
        return NextResponse.json(
          { message: "Yalnızca onaylı öğrenciler değerlendirme yapabilir" },
          { status: 403 },
        );
      }

      const { bookingId, teacherId, rating, comment } = await request.json();

      if (!bookingId || !teacherId || !rating) {
        return NextResponse.json(
          { message: "Lütfen tüm gerekli alanları doldurun" },
          { status: 400 },
        );
      }

      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { message: "Puan 1 ile 5 arasında olmalıdır" },
          { status: 400 },
        );
      }

      const review = await submitLessonReview(bookingId, user.id, teacherId, rating, comment);

      // `submitLessonReview` also flips the booking status to `completed`,
      // so BOTH the public teachers listing (avg rating / review count)
      // and the per-teacher dashboard stats (completed lessons, income)
      // need invalidation.
      revalidateTag(CACHE_TAGS.teachers);
      revalidateTag(CACHE_TAGS.teacherStats(teacherId));

      return NextResponse.json({
        message: "Değerlendirmeniz başarıyla gönderildi",
        review: review[0],
      });
    } catch (error) {
      const log = await getRequestLogger({ userId: user.id, labels: { module: "private-lesson", action: "submit-review" } });
      log.error({
        message: "submit review failed",
        error,
        source: "api-route",
        location: "private-lesson/submit-review",
      });

      if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }

      return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
    }
  },
);
