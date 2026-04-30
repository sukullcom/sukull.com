import { NextResponse } from "next/server";
import { secureApi } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit-db";
import { newCsrfToken, setCsrfCookie } from "@/lib/csrf";

/**
 * Issues a fresh CSRF token and sets the companion cookie (double-submit).
 * Call before mutating APIs (öğretmen profili, ilan/teklif, sohbet mesajı, …);
 * send the returned token in the `x-csrf-token` header on PATCH/POST.
 */
export const GET = secureApi.authRateLimited(
  {
    bucket: "csrf-mint",
    keyKind: "user",
    ...RATE_LIMITS.csrfMint,
  },
  async () => {
    const token = newCsrfToken();
    const res = NextResponse.json({ ok: true, csrfToken: token });
    setCsrfCookie(res, token);
    return res;
  },
);
