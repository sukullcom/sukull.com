import { describe, expect, it } from "vitest";
import { parseReviewBody } from "@/lib/review-guard";

describe("parseReviewBody", () => {
  it("accepts minimal valid payload", () => {
    const r = parseReviewBody({ rating: 5 });
    expect(r).toEqual({ ok: true, rating: 5, comment: null, offerId: null });
  });

  it("accepts string rating and offerId", () => {
    const r = parseReviewBody({ rating: "10", offerId: "42", comment: "  ok  " });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.rating).toBe(10);
      expect(r.offerId).toBe(42);
      expect(r.comment).toBe("ok");
    }
  });

  it("rejects rating out of range", () => {
    const r = parseReviewBody({ rating: 11 });
    expect(r.ok).toBe(false);
  });

  it("rejects long comment", () => {
    const r = parseReviewBody({ rating: 1, comment: "x".repeat(501) });
    expect(r.ok).toBe(false);
  });
});
