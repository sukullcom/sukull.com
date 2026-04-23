import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { secureApi, ApiResponses } from "@/lib/api-middleware";
import { bookLesson, hasAvailableCredits, isApprovedStudent } from "@/db/queries";
import { RATE_LIMITS } from "@/lib/rate-limit-db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getRequestLogger } from "@/lib/logger";

/**
 * Rate-limit shape: per-USER (not IP) — a booking is tied to user credits,
 * and the student is the only one who can spend them. 10 attempts/minute
 * comfortably covers the genuine flow (one booking involves multiple
 * timeslot checks) while blocking scripted calendar brute-force.
 */
export const POST = secureApi.authRateLimited(
  { bucket: "book-lesson", keyKind: "user", ...RATE_LIMITS.booking },
  async (request: NextRequest, user) => {
    try {
      const isStudent = await isApprovedStudent(user.id);
      if (!isStudent) {
        return ApiResponses.forbidden("Ders rezervasyonu yapabilmek için onaylı öğrenci olmanız gerekiyor");
      }

      const { teacherId, startTime, endTime } = await request.json();

      if (!teacherId || !startTime || !endTime) {
        return ApiResponses.badRequest("Lütfen tüm gerekli alanları doldurun");
      }

      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return ApiResponses.badRequest("Geçersiz tarih formatı");
      }

      if (startDate >= endDate) {
        return ApiResponses.badRequest("Başlangıç zamanı bitiş zamanından önce olmalıdır");
      }

      if (startDate <= new Date()) {
        return ApiResponses.badRequest("Geçmişte ders rezervasyonu yapamazsınız");
      }

      const hasCredits = await hasAvailableCredits(user.id, 1);
      if (!hasCredits) {
        return ApiResponses.badRequest("Krediniz yetersiz. Lütfen ders rezervasyonu yapmak için kredi satın alın.");
      }

      const booking = await bookLesson(user.id, teacherId, startDate, endDate);

      // A new booking shifts the teacher's total-lessons aggregate.
      // Busting the per-teacher stats tag keeps the dashboard live
      // without waiting for the 60s TTL to expire.
      revalidateTag(CACHE_TAGS.teacherStats(teacherId));

      return ApiResponses.created({
        message: "Ders başarıyla rezerve edildi",
        booking: booking[0],
      });
    } catch (error) {
      const log = await getRequestLogger({ userId: user.id, labels: { module: "private-lesson", action: "book-lesson" } });
      log.error({
        message: "book lesson failed",
        error,
        source: "api-route",
        location: "private-lesson/book-lesson",
      });

      if (error instanceof Error) {
        return ApiResponses.badRequest(error.message);
      }

      return ApiResponses.serverError("Ders rezervasyonu sırasında bir hata oluştu");
    }
  },
);


