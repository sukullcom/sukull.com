import { describe, expect, it } from "vitest";

import { normalizeRefereeEmail } from "@/lib/referral-code";

describe("normalizeRefereeEmail", () => {
  it("lowercases and trims valid emails", () => {
    expect(normalizeRefereeEmail("  Gorkem@Example.COM ")).toBe(
      "gorkem@example.com",
    );
  });

  it("rejects invalid values", () => {
    expect(normalizeRefereeEmail("")).toBeNull();
    expect(normalizeRefereeEmail("not-an-email")).toBeNull();
    expect(normalizeRefereeEmail(null)).toBeNull();
  });
});
