import { describe, expect, it } from "vitest";
import { resolveAllowed } from "@/lib/rate-limit-allowed";

describe("resolveAllowed", () => {
  it("uses boolean allowed when present", () => {
    expect(resolveAllowed({ allowed: true, remaining: 2, reset_at: new Date().toISOString() }, 3)).toBe(true);
    expect(resolveAllowed({ allowed: false, remaining: 0, reset_at: new Date().toISOString() }, 3)).toBe(false);
  });

  it("falls back to current_count <= max when allowed is missing", () => {
    expect(resolveAllowed({ current_count: 1, remaining: 2 }, 3)).toBe(true);
    expect(resolveAllowed({ current_count: 4, remaining: 0 }, 3)).toBe(false);
  });

  it("infers allowed from remaining > 0 when other signals missing", () => {
    expect(resolveAllowed({ remaining: 2 }, 3)).toBe(true);
    expect(resolveAllowed({ remaining: "2" }, 3)).toBe(true);
  });
});
