import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, getClientIpFromHeaders, RATE_LIMITS } from "@/lib/rate-limit-db";
import { normalizeReferralCode } from "@/lib/referral-code";

const isProd = process.env.NODE_ENV === "production";

/**
 * Tarayıcıya httpOnly `sk_ref` çerezi yazar (Google ile kayıt gibi akışlarda
 * e-posta metadata’sına eklenemeyen davet kodunu taşımak için).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIpFromHeaders(req.headers);
  const rl = await checkRateLimit({
    key: `referral-cookie:ip:${ip}`,
    ...RATE_LIMITS.referralSetCookieIp,
  });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const code =
    typeof body === "object" && body !== null && "code" in body
      ? normalizeReferralCode(String((body as { code?: unknown }).code ?? ""))
      : null;

  if (!code) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("sk_ref", code, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
