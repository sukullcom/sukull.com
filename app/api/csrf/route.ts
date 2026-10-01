import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
  rateLimitClosedDenyPayload,
} from "@/lib/rate-limit-db";
import { newCsrfToken, setCsrfCookie } from "@/lib/csrf";

/**
 * Issues a fresh CSRF token and sets the companion cookie (double-submit).
 * Public (IP-limited) so marketplace guests can mint before identity signup;
 * logged-in users share the same cookie pattern.
 */
export async function GET(request: NextRequest) {
  const user = await getServerUser();
  const scope = user ? `user:${user.id}` : `ip:${getClientIp(request)}`;
  const rl = await checkRateLimit({
    key: `csrf-mint:${scope}`,
    ...RATE_LIMITS.csrfMint,
  });
  if (!rl.allowed) {
    const deny = rateLimitClosedDenyPayload(rl, {
      rateLimited: "Çok fazla istek. Lütfen biraz bekleyin.",
      storeUnavailable:
        "İstek sınırı şu an doğrulanamıyor. Bir dakika sonra tekrar dene.",
    });
    return NextResponse.json(deny.body, {
      status: deny.status,
      headers: deny.headers,
    });
  }

  const token = newCsrfToken();
  const res = NextResponse.json({ ok: true, csrfToken: token });
  setCsrfCookie(res, token);
  return res;
}
