/**
 * GET /api/teachers/[teacherId]/reviews?cursor=&limit=
 * Paginated reviews + aggregate stats (cached ~60s server-side).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import {
  assertTeacherExists,
  getTeacherReviewAggregate,
  listTeacherReviewsPage,
} from "@/db/queries/teacher-reviews";

type Ctx = { params: { teacherId: string } };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const rl = await checkRateLimit({
      key: `teacher-reviews-list:user:${user.id}`,
      ...RATE_LIMITS.read,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok sık istek. Biraz sonra tekrar deneyin." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const teacherId = ctx.params.teacherId?.trim() ?? "";
    if (!teacherId) {
      return NextResponse.json({ error: "Eğitmen bulunamadı." }, { status: 400 });
    }

    const teacher = await assertTeacherExists(teacherId);
    if (!teacher) {
      return NextResponse.json({ error: "Eğitmen bulunamadı." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
    const cursorRaw = searchParams.get("cursor");
    const cursor =
      cursorRaw != null && cursorRaw !== "" ? Number.parseInt(cursorRaw, 10) : null;

    const [aggregate, page] = await Promise.all([
      getTeacherReviewAggregate(teacherId),
      listTeacherReviewsPage(teacherId, {
        limit: Number.isFinite(limit) ? limit : 20,
        cursor: cursor != null && Number.isFinite(cursor) ? cursor : null,
      }),
    ]);

    return NextResponse.json({
      averageRating: aggregate.averageRating,
      reviewCount: aggregate.reviewCount,
      nextCursor: page.nextCursor,
      reviews: page.reviews,
    });
  } catch (error) {
    const log = await getRequestLogger({
      labels: { route: "api/teachers/[teacherId]/reviews", op: "GET" },
    });
    log.error({
      message: "teacher reviews GET failed",
      error,
      location: "api/teachers/reviews",
    });
    return NextResponse.json({ error: "İstek işlenemedi." }, { status: 500 });
  }
}
