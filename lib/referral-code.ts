import { randomBytes } from "crypto";

import { REFERRAL_SYSTEM } from "@/constants";

const CODE_REGEX = new RegExp(
  `^${REFERRAL_SYSTEM.CODE_PREFIX}[A-F0-9]{${REFERRAL_SYSTEM.CODE_BODY_LENGTH}}$`,
  "i",
);

export function normalizeReferralCode(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = String(raw).trim().toUpperCase().replace(/\s+/g, "");
  if (!t) return null;
  return CODE_REGEX.test(t) ? t : null;
}

/** Davet ödülü idempotency — hesap silinip aynı e-postayla yeniden kayıtta tekrar ödül engeli. */
export function normalizeRefereeEmail(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const normalized = String(raw).trim().toLowerCase();
  if (!normalized.includes("@")) return null;
  return normalized;
}

export function mintReferralCodeCandidate(): string {
  const body = randomBytes(REFERRAL_SYSTEM.CODE_BODY_LENGTH / 2)
    .toString("hex")
    .toUpperCase();
  return `${REFERRAL_SYSTEM.CODE_PREFIX}${body}`;
}
