import "server-only";

import { checkRateLimit } from "@/lib/rate-limit-db";

type ErrorFingerprintInput = {
  source: string;
  location?: string;
  level?: string;
};

/** Aynı bilinen hata için tüm Vercel instance'larında en fazla 1 DB satırı / pencere. */
const DISTRIBUTED_COALESCE_WINDOW_SEC = 6 * 60 * 60; // 6 saat

/**
 * Minified / tekrarlayan istemci hatalarını tek parmak izine indirger.
 * Örn. her ziyaretçide aynı React #419 → tek bucket.
 */
export function normalizeErrorMessageForCoalesce(message: string): string {
  const m = message.trim();
  if (/Minified React error #419/i.test(m)) {
    return "React hydration mismatch (#419)";
  }
  if (/hydration/i.test(m) && /did not match|mismatch|failed/i.test(m)) {
    return "React hydration mismatch";
  }
  if (/Text content does not match/i.test(m)) {
    return "React hydration text mismatch";
  }
  return m.slice(0, 200);
}

export function buildErrorFingerprint(
  opts: ErrorFingerprintInput,
  message: string,
): string {
  const normalized = normalizeErrorMessageForCoalesce(message);
  return `${opts.source}|${opts.location ?? ""}|${opts.level ?? "error"}|${normalized}`;
}

/**
 * Postgres `check_rate_limit` ile dağıtık dedupe.
 * `false` → bu pencerede aynı fingerprint zaten loglandı, insert atla.
 */
export async function shouldPersistErrorToDb(
  opts: ErrorFingerprintInput,
  message: string,
): Promise<boolean> {
  const fingerprint = buildErrorFingerprint(opts, message);
  const rl = await checkRateLimit({
    key: `error-log-coalesce:${fingerprint}`,
    max: 1,
    windowSeconds: DISTRIBUTED_COALESCE_WINDOW_SEC,
  });
  return rl.allowed;
}
