import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { addPointsToUser } from "@/actions/challenge-progress";
import { MAX_POINTS_ADD_PER_REQUEST } from "@/lib/api-limits";
import { getRequestLogger } from "@/lib/logger";

/**
 * POST /api/user/points/add
 *
 * Delegates validation and rate limiting to `addPointsToUser`, which is the
 * single source of truth for the point-awarding contract (caps, bucket keys
 * and shape). The route's job is to:
 *   1. Parse the JSON envelope.
 *   2. Translate the action's `PointsValidationError` into HTTP status
 *      codes that the mobile client can react to.
 *
 * Historical note: this route previously duplicated validation + rate-limit
 * logic. That drifted over time (the direct server-action path was left
 * unguarded) and caused the leaderboard leak documented in the Sprint A
 * audit. Keeping enforcement in one place prevents regressions.
 *
 * Body: { points: number; gameType?: string }
 *   `points` — pozitif tam sayı
 *   `gameType` — opsiyonel; sağlanırsa oyuna özgü üst sınır uygulanır
 */
export async function POST(request: Request) {
  const log = await getRequestLogger({ labels: { route: "api/user/points/add" } });

  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Kimlik doğrulama gerekli" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Geçersiz gövde" }, { status: 400 });
    }

    const raw = (body as { points?: unknown }).points;
    const gameTypeRaw = (body as { gameType?: unknown }).gameType;
    const gameType = typeof gameTypeRaw === "string" ? gameTypeRaw : undefined;

    if (raw === undefined || raw === null) {
      return NextResponse.json({ error: "points gerekli" }, { status: 400 });
    }

    const points = typeof raw === "number" ? raw : Number(raw);

    try {
      const result = await addPointsToUser(points, gameType ? { gameType } : undefined);
      return NextResponse.json({
        success: true,
        pointsAdded: result?.pointsAdded ?? points,
        newTotal: result?.newTotal,
        message: "Puan eklendi ve istikrar güncellendi",
      });
    } catch (err) {
      // Narrow to our validation error by name — `instanceof` is unreliable
      // across the action boundary (same class, different module copies
      // theoretically possible under HMR).
      if (err instanceof Error && err.name === "PointsValidationError") {
        const code = (err as Error & { code?: string }).code;
        const status = code === "rate_limited" ? 429 : 400;
        return NextResponse.json(
          { error: err.message, code, max: MAX_POINTS_ADD_PER_REQUEST },
          { status }
        );
      }
      throw err;
    }
  } catch (error) {
    log.error({ message: "add points failed", error, location: "api/user/points/add" });
    return NextResponse.json(
      { error: "Puan eklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
