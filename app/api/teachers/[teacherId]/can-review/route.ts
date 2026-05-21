/**
 * GET /api/teachers/[teacherId]/can-review
 * Authenticated student: whether they may POST a review for this teacher.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  RATE_LIMITS,
  rateLimitHeaders,
} from "@/lib/rate-limit-db";
import { getCanReviewOverview, assertTeacherExists } from "@/db/queries/teacher-reviews";

type Ctx = { params: { teacherId: string } };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const rl = await checkRateLimit({
      key: `teacher-can-review:user:${user.id}`,
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

    if (user.id === teacherId) {
      return NextResponse.json({
        canReview: false,
        alreadyReviewed: false,
        reason: "self",
      });
    }

    const overview = await getCanReviewOverview(user.id, teacherId);
    return NextResponse.json({
      canReview: overview.canReview,
      alreadyReviewed: overview.alreadyReviewed,
      suggestedOfferId: overview.suggestedOfferId,
      viaMessaging: overview.viaMessaging,
      viaAcceptedOffer: overview.viaAcceptedOffer,
      chatId: overview.chatId,
    });
  } catch (error) {
    const log = await getRequestLogger({
      labels: { route: "api/teachers/[teacherId]/can-review", op: "GET" },
    });
    log.error({
      message: "can-review failed",
      error,
      location: "api/teachers/can-review",
    });
    return NextResponse.json({ error: "İstek işlenemedi." }, { status: 500 });
  }
}
