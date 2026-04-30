/**
 * POST /api/private-lesson/messages/unlock
 *   Student spends 1 credit to open a 1-on-1 chat with a teacher
 *   (eğitmen rehberinde listelenen profiller). Idempotent: if the pair
 *   has already been unlocked, returns the existing chat without
 *   charging again.
 *
 *   Body: { teacherId: string }
 *   Response: { chatId: number, alreadyUnlocked: boolean }
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
  getMessageUnlock,
  hasAvailableCredits,
  unlockMessageThread,
} from "@/db/queries";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const teacherId = typeof body.teacherId === "string" ? body.teacherId.trim() : "";
    if (!teacherId) {
      return NextResponse.json(
        { error: "Eğitmen seçmelisin" },
        { status: 400 },
      );
    }

    /**
     * Açık kilidi ve chatId varsa doğrudan dön (rate limit tüketme).
     * Yeni kilitlemede önce kredi kontrolü, sonra rate limit, sonra işlem.
     */
    const alreadyUnlocked = await getMessageUnlock(user.id, teacherId);
    if (alreadyUnlocked?.chatId != null) {
      return NextResponse.json({
        chatId: alreadyUnlocked.chatId,
        alreadyUnlocked: true,
      });
    }

    if (!alreadyUnlocked) {
      const canPay = await hasAvailableCredits(user.id, 1);
      if (!canPay) {
        return NextResponse.json(
          { error: "Yetersiz kredi. Kredi satın alın ve tekrar deneyin." },
          { status: 402 },
        );
      }
    }

    // Money flow: opening an unlock spends 1 credit. If the rate-limit
    // backing store is unreachable we prefer to refuse the write (503
    // via retry) over accepting an unbounded burst that could drain
    // many users' credits during a DB incident.
    const rl = await checkRateLimit({
      key: `messageUnlock:user:${user.id}`,
      ...RATE_LIMITS.messageUnlock,
      onStoreError: "closed",
    });
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error:
            "Kısa sürede çok fazla mesaj kilidi denemesi yapıldı. Lütfen biraz sonra tekrar dene.",
          retryAfterSeconds: rl.retryAfter,
        },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const result = await unlockMessageThread({
      studentId: user.id,
      teacherId,
    });

    if (!result.ok) {
      const [status, message] = unlockErrorToHttp(result.code);
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({
      chatId: result.chatId,
      alreadyUnlocked: result.alreadyUnlocked,
    });
  } catch (error) {
    const log = await getRequestLogger({
      labels: {
        route: "api/private-lesson/messages/unlock",
        op: "unlock",
      },
    });
    log.error({
      message: "unlock message failed",
      error,
      location: "api/private-lesson/messages/unlock/POST",
    });
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}

function unlockErrorToHttp(
  code:
    | "self_unlock_forbidden"
    | "teacher_not_found"
    | "insufficient_credits"
    | "unknown",
): [number, string] {
  switch (code) {
    case "self_unlock_forbidden":
      return [400, "Kendinize mesaj gönderemezsiniz"];
    case "teacher_not_found":
      return [404, "Eğitmen bulunamadı"];
    case "insufficient_credits":
      return [402, "Yetersiz kredi. Kredi satın alın ve tekrar deneyin."];
    default:
      return [500, "İşlem başarısız"];
  }
}
