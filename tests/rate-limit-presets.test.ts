import { describe, it, expect, vi } from "vitest";

// Stub `server-only` so rate-limit-db can be imported in a Node test env.
vi.mock("server-only", () => ({}));

// Stub the database module — the preset constants we test never hit the DB.
vi.mock("@/db/drizzle", () => ({
  default: {
    execute: vi.fn(),
  },
}));

import { RATE_LIMITS, getClientIp, rateLimitHeaders } from "@/lib/rate-limit-db";

describe("RATE_LIMITS presets", () => {
  it("has reasonable bounds for auth endpoints", () => {
    // Login should be strict enough to block brute-force attempts but loose
    // enough that a normal user fat-fingering the password is not locked out.
    expect(RATE_LIMITS.login.max).toBeLessThanOrEqual(20);
    expect(RATE_LIMITS.login.max).toBeGreaterThanOrEqual(5);
    expect(RATE_LIMITS.login.windowSeconds).toBeGreaterThanOrEqual(60);
  });

  it("register is stricter than login (higher cost per attempt)", () => {
    expect(RATE_LIMITS.register.max).toBeLessThanOrEqual(RATE_LIMITS.login.max);
  });

  it("points-add is generous enough for active play", () => {
    // Active games can award points multiple times per second
    expect(RATE_LIMITS.pointsAdd.max).toBeGreaterThanOrEqual(60);
  });

  it("leaderboard read has a sane per-minute cap", () => {
    expect(RATE_LIMITS.leaderboard.max).toBeGreaterThanOrEqual(30);
    expect(RATE_LIMITS.leaderboard.max).toBeLessThanOrEqual(200);
  });

  it("all presets have positive integers", () => {
    for (const [name, preset] of Object.entries(RATE_LIMITS)) {
      expect(Number.isInteger(preset.max), `${name}.max`).toBe(true);
      expect(Number.isInteger(preset.windowSeconds), `${name}.windowSeconds`).toBe(true);
      expect(preset.max, name).toBeGreaterThan(0);
      expect(preset.windowSeconds, name).toBeGreaterThan(0);
    }
  });
});

describe("getClientIp", () => {
  function buildRequest(headers: Record<string, string>): Request {
    return new Request("http://example.test", { headers });
  }

  it("prefers Cloudflare-Connecting-Ip", () => {
    const req = buildRequest({
      "cf-connecting-ip": "1.1.1.1",
      "x-forwarded-for": "2.2.2.2",
      "x-real-ip": "3.3.3.3",
    });
    expect(getClientIp(req)).toBe("1.1.1.1");
  });

  it("falls back to X-Real-Ip when CF header absent", () => {
    const req = buildRequest({
      "x-real-ip": "3.3.3.3",
      "x-forwarded-for": "2.2.2.2",
    });
    expect(getClientIp(req)).toBe("3.3.3.3");
  });

  it("takes the first entry of a comma-separated X-Forwarded-For", () => {
    const req = buildRequest({
      "x-forwarded-for": "4.4.4.4, 2.2.2.2, 1.1.1.1",
    });
    expect(getClientIp(req)).toBe("4.4.4.4");
  });

  it("returns 'unknown' when no header is present", () => {
    const req = buildRequest({});
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("rateLimitHeaders", () => {
  it("exposes remaining, reset and Retry-After", () => {
    const resetAt = new Date("2030-01-01T00:00:00Z");
    const headers = rateLimitHeaders({
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: 42,
    });
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
    expect(headers["Retry-After"]).toBe("42");
    expect(headers["X-RateLimit-Reset"]).toBe(
      String(Math.floor(resetAt.getTime() / 1000)),
    );
  });
});
