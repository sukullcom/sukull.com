import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { addPointsToUser } from "@/actions/challenge-progress";
import { MAX_POINTS_ADD_PER_REQUEST } from "@/lib/api-limits";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit-db";

/**
 * POST /api/user/points/add
 * Adds points to user and automatically updates streak
 * Used by mobile app to ensure streak is synced across platforms
 *
 * Body: { points: number } — pozitif tam sayı, istek başına üst sınır: MAX_POINTS_ADD_PER_REQUEST
 */
export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Kimlik doğrulama gerekli" },
        { status: 401 }
      );
    }

    const rl = await checkRateLimit({
      key: `points-add:user:${user.id}`,
      ...RATE_LIMITS.pointsAdd,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen biraz bekleyin." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const body = await request.json();
    const raw = body?.points;

    if (raw === undefined || raw === null) {
      return NextResponse.json({ error: "points gerekli" }, { status: 400 });
    }

    const points = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(points) || points <= 0 || !Number.isInteger(points)) {
      return NextResponse.json(
        { error: "Geçersiz puan: pozitif tam sayı olmalı" },
        { status: 400 }
      );
    }

    if (points > MAX_POINTS_ADD_PER_REQUEST) {
      return NextResponse.json(
        {
          error: "İstek başına izin verilen üst sınır aşıldı",
          max: MAX_POINTS_ADD_PER_REQUEST,
        },
        { status: 400 }
      );
    }

    await addPointsToUser(points);

    return NextResponse.json({ 
      success: true,
      pointsAdded: points,
      message: "Puan eklendi ve istikrar güncellendi"
    });
  } catch (error) {
    console.error("Error adding points:", error);
    return NextResponse.json(
      { error: "Puan eklenirken hata oluştu" },
      { status: 500 }
    );
  }
}

