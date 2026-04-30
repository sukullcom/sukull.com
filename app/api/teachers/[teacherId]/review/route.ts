/**
 * POST /api/teachers/[teacherId]/review
 * One-time student review (1–10 + optional comment). CSRF + same-origin.
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import { parseReviewBody } from "@/lib/review-guard";
import { verifyCsrf } from "@/lib/csrf";
import { isTrustedApiOrigin } from "@/lib/same-origin-api";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  assertTeacherExists,
  findAcceptedOfferForReview,
  findExistingReview,
  getMessagingReviewEligibility,
  insertTeacherReview,
} from "@/db/queries/teacher-reviews";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

type Ctx = { params: { teacherId: string } };

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    if (!isTrustedApiOrigin(request) || !verifyCsrf(request)) {
      return NextResponse.json(
        { error: "Geçersiz istek veya güvenlik doğrulaması başarısız." },
        { status: 403 },
      );
    }

    const teacherId = ctx.params.teacherId?.trim() ?? "";
    if (!teacherId) {
      return NextResponse.json({ error: "Eğitmen bulunamadı." }, { status: 400 });
    }

    if (user.id === teacherId) {
      return NextResponse.json({ error: "Kendinizi değerlendiremezsiniz." }, { status: 403 });
    }

    const teacher = await assertTeacherExists(teacherId);
    if (!teacher) {
      return NextResponse.json({ error: "Eğitmen bulunamadı." }, { status: 404 });
    }

    const me = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { role: true },
    });
    const myRole = me?.role ?? "user";

    if (myRole === "teacher" || myRole === "admin") {
      return NextResponse.json(
        { error: "Geri bildirim yalnızca öğrenci hesapları içindir." },
        { status: 403 },
      );
    }

    const body = parseReviewBody(await request.json().catch(() => ({})));
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: 400 });
    }

    const rl = await checkRateLimit({
      key: `teacherReviewDaily:user:${user.id}:teacher:${teacherId}`,
      ...RATE_LIMITS.teacherReviewDaily,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Bu eğitmen için günlük değerlendirme limitine ulaştın. Yarın tekrar dene." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const existing = await findExistingReview(user.id, teacherId);
    if (existing) {
      return NextResponse.json(
        { error: "Bu eğitmen için zaten bir değerlendirme gönderdin." },
        { status: 409 },
      );
    }

    let offerIdToStore: number | null = null;
    if (body.offerId != null) {
      const offer = await findAcceptedOfferForReview(body.offerId, user.id, teacherId);
      if (!offer) {
        return NextResponse.json(
          { error: "Bu teklif için değerlendirme gönderemezsin veya teklif geçersiz." },
          { status: 403 },
        );
      }
      offerIdToStore = offer.id;
    } else {
      const msgElig = await getMessagingReviewEligibility(user.id, teacherId);
      if (!msgElig.ok) {
        return NextResponse.json(
          {
            error:
              "Değerlendirme için önce kabul edilmiş bir teklif (offerId ile) veya son 30 günde karşılıklı mesajlaşma gerekir.",
          },
          { status: 403 },
        );
      }
    }

    try {
      const row = await insertTeacherReview({
        teacherId,
        studentId: user.id,
        offerId: offerIdToStore,
        rating: body.rating,
        comment: body.comment,
      });
      if (!row) {
        return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 });
      }

      revalidateTag(CACHE_TAGS.teacherReviews(teacherId));
      revalidateTag(CACHE_TAGS.teachers);
      revalidateTag(CACHE_TAGS.teacherStats(teacherId));

      return NextResponse.json(
        {
          id: row.id,
          rating: row.rating,
          comment: row.comment,
          createdAt: row.createdAt.toISOString(),
          offerId: row.offerId,
        },
        { status: 201 },
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json(
          { error: "Bu eğitmen için zaten bir değerlendirme gönderdin." },
          { status: 409 },
        );
      }
      throw err;
    }
  } catch (error) {
    const log = await getRequestLogger({
      labels: { route: "api/teachers/[teacherId]/review", op: "POST" },
    });
    log.error({
      message: "teacher review POST failed",
      error,
      location: "api/teachers/review",
    });
    return NextResponse.json({ error: "İstek işlenemedi." }, { status: 500 });
  }
}
