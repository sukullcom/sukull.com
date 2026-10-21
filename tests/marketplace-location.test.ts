import { describe, expect, it } from "vitest";

import { ANYWHERE_SLUGS, isLocalRequest, nearbyFirst, providerCanSee } from "@/lib/marketplace/location";
import { resolveExpiry } from "@/lib/marketplace/validate-request";

describe("ilan konumu", () => {
  it("yerinde yapılan iş başka ildeki hizmet verene görünmez", () => {
    const request = { serviceSlug: "boya-badana", city: "Ankara" };
    expect(providerCanSee("İstanbul", request)).toBe(false);
    expect(providerCanSee("Ankara", request)).toBe(true);
    expect(providerCanSee(null, request)).toBe(false);
  });

  it("online ilan her şehre gider", () => {
    const request = { serviceSlug: "psikolog", city: "Online" };
    expect(isLocalRequest(request.serviceSlug, request.city)).toBe(false);
    expect(providerCanSee("İzmir", request)).toBe(true);
    expect(providerCanSee(null, request)).toBe(true);
  });

  it("uzaktan yapılan hizmet şehirden bağımsızdır", () => {
    expect(ANYWHERE_SLUGS).toContain("yazilim-projesi");
    expect(ANYWHERE_SLUGS).toContain("sehirler-arasi-nakliyat");
    expect(ANYWHERE_SLUGS).not.toContain("boya-badana");
    expect(providerCanSee("İzmir", { serviceSlug: "yazilim-projesi", city: "Ankara" })).toBe(true);
  });

  it("aynı ilçedeki ilanlar önce gelir", () => {
    const rows = [
      { id: 1, district: "Kadıköy", createdAt: new Date("2026-10-20") },
      { id: 2, district: "Avcılar", createdAt: new Date("2026-10-21") },
      { id: 3, district: "Avcılar", createdAt: new Date("2026-10-19") },
    ];
    expect(nearbyFirst(rows, "Avcılar").map((row) => row.id)).toEqual([2, 3, 1]);
    expect(nearbyFirst(rows, null).map((row) => row.id)).toEqual([1, 2, 3]);
  });

  it("sadece fiyat bakıyorum bir ay açık kalır", () => {
    const now = new Date("2026-10-22T10:00:00Z");
    const result = resolveExpiry("price_check", null, now);
    expect(result.ok && result.scheduledAt === null && result.expiresAt.getUTCMonth()).toBe(10);
  });
});
