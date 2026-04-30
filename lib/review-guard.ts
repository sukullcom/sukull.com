/** Days: last message must be within this window for messaging-based eligibility. */
export const REVIEW_MESSAGE_RECENCY_DAYS = 30;

/**
 * Request parsing for teacher review POST bodies (pure; unit-tested).
 */
export type ParsedReviewBody =
  | { ok: true; rating: number; comment: string | null; offerId: number | null }
  | { ok: false; error: string };

const MAX_COMMENT = 500;

export function parseReviewBody(body: unknown): ParsedReviewBody {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "Geçersiz istek gövdesi." };
  }
  const o = body as Record<string, unknown>;
  const ratingRaw = o.rating;
  const rating =
    typeof ratingRaw === "number"
      ? ratingRaw
      : typeof ratingRaw === "string"
        ? Number.parseInt(ratingRaw, 10)
        : NaN;
  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    return { ok: false, error: "Puan 1 ile 10 arasında bir tam sayı olmalıdır." };
  }

  let comment: string | null = null;
  if (o.comment !== undefined && o.comment !== null) {
    if (typeof o.comment !== "string") {
      return { ok: false, error: "Yorum metni geçersiz." };
    }
    const t = o.comment.trim();
    if (t.length > MAX_COMMENT) {
      return { ok: false, error: `Yorum en fazla ${MAX_COMMENT} karakter olabilir.` };
    }
    comment = t.length > 0 ? t : null;
  }

  let offerId: number | null = null;
  if (o.offerId !== undefined && o.offerId !== null) {
    const id =
      typeof o.offerId === "number"
        ? o.offerId
        : typeof o.offerId === "string"
          ? Number.parseInt(o.offerId, 10)
          : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return { ok: false, error: "Geçersiz teklif numarası." };
    }
    offerId = id;
  }

  return { ok: true, rating, comment, offerId };
}
