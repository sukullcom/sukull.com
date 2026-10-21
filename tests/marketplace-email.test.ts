import { describe, expect, it } from "vitest";

import { digestIsDue, digestSince, pickDigestRequests } from "@/lib/marketplace/digest";
import { readDigestToken, signDigestToken } from "@/lib/marketplace/email-token";

const DAY = 24 * 60 * 60 * 1000;

describe("marketplace digest mail", () => {
  it("waits three days between summaries", () => {
    const now = new Date("2026-10-21T21:00:00.000Z");
    expect(digestIsDue(null, now)).toBe(true);
    expect(digestIsDue(new Date(now.getTime() - 2 * DAY), now)).toBe(false);
    expect(digestIsDue(new Date(now.getTime() - 3 * DAY), now)).toBe(true);
  });

  it("includes the gap since the previous summary", () => {
    const now = new Date("2026-10-21T21:00:00.000Z");
    const last = new Date(now.getTime() - 5 * DAY);
    expect(digestSince(null, now).getTime()).toBe(now.getTime() - 3 * DAY);
    expect(digestSince(last, now).getTime()).toBe(last.getTime());
  });

  it("sends a game request only to the game provider", () => {
    const rows = [
      { id: 1, serviceSlug: "yazilim-projesi", customerId: "customer", answers: [{ id: "tur", answer: "Oyun geliştirme" }] },
      { id: 2, serviceSlug: "yazilim-projesi", customerId: "customer", answers: [{ id: "tur", answer: "Veri analizi" }] },
      { id: 3, serviceSlug: "yazilim-projesi", customerId: "provider", answers: [{ id: "tur", answer: "Oyun geliştirme" }] },
    ];
    const picked = pickDigestRequests("provider", [{ slug: "yazilim-projesi", filters: { variants: ["Oyun geliştirme"] } }], rows);
    expect(picked.map((row) => row.id)).toEqual([1]);
  });

  it("signs an unsubscribe token that only opens for that account", () => {
    const secret = "test-secret";
    const token = signDigestToken("11111111-1111-4111-8111-111111111111", secret);
    expect(readDigestToken(token, secret)).toBe("11111111-1111-4111-8111-111111111111");
    expect(readDigestToken(token, "other-secret")).toBeNull();
    expect(readDigestToken(`${token}x`, secret)).toBeNull();
  });
});