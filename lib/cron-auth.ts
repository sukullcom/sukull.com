import "server-only";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * Cron endpoint yetki doğrulama yardımcısı.
 *
 * Niye merkezi?
 *   1. Düz `header === \`Bearer ${process.env.CRON_SECRET}\`` karşılaştırması,
 *      `CRON_SECRET` tanımsızsa `Bearer undefined` ile eşleşir — saldırgan
 *      başlığı kopyalayarak cron'u tetikleyebilir.
 *   2. Düz string eşitliği timing-safe değildir; ölçülebilir farkla token
 *      tahmini teoride mümkün.
 *
 * Bu yardımcı her iki riski kapatır: prod'da secret zorunlu, karşılaştırma
 * sabit zamanlı.
 */

export type CronAuthResult =
  | { ok: true }
  | { ok: false; reason: "missing_secret" | "invalid_token" | "no_token" };

export type CronAuthOptions = {
  /**
   * `true` (varsayılan) ise Vercel Cron başlığı (`x-vercel-cron`) Bearer
   * yerine kabul edilir. Sadece bilinen vendor başlığını cron platformu
   * kendisi enjekte edebilir; istemciden gelirse middleware bunu
   * temizlemelidir (`middleware.ts` zaten yapıyor).
   */
  allowVercelCronHeader?: boolean;
};

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export function verifyCronAuth(
  request: NextRequest,
  options?: CronAuthOptions,
): CronAuthResult {
  const allowVercel = options?.allowVercelCronHeader ?? true;
  const secret = process.env.CRON_SECRET;

  if (!secret || secret.length < 16) {
    if (allowVercel && request.headers.get("x-vercel-cron") === "1") {
      return { ok: true };
    }
    return { ok: false, reason: "missing_secret" };
  }

  if (allowVercel && request.headers.get("x-vercel-cron") === "1") {
    return { ok: true };
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, reason: "no_token" };
  }
  const provided = authHeader.slice("Bearer ".length).trim();
  if (!provided) return { ok: false, reason: "no_token" };

  return safeEqual(provided, secret)
    ? { ok: true }
    : { ok: false, reason: "invalid_token" };
}
