import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CATEGORIES, SERVICES } from "@/lib/marketplace/catalog";
import { CATEGORY_IMAGES } from "@/lib/marketplace/category-images";
import { serviceVariants } from "@/lib/marketplace/provider-match";
import { parsePreset, searchServices } from "@/lib/marketplace/search";

describe("marketplace catalog", () => {
  it("has unique slugs and valid categories", () => {
    const slugs = SERVICES.map((service) => service.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const categories = new Set(CATEGORIES.map((category) => category.slug));
    for (const service of SERVICES) expect(categories.has(service.categorySlug)).toBe(true);
  });

  it("has unique question ids and options per service", () => {
    for (const service of SERVICES) {
      const ids = service.questions.map((question) => question.id);
      expect(new Set(ids).size, service.slug).toBe(ids.length);
      for (const question of service.questions) {
        const options = question.options ?? [];
        expect(new Set(options).size, `${service.slug}.${question.id}`).toBe(options.length);
        if (question.kind === "multi") {
          for (const option of options) expect(option.value, `${service.slug}.${question.id}`).not.toContain(",");
        }
      }
    }
  });

  it("has at most one area question per service, with real options", () => {
    for (const service of SERVICES) {
      const areas = service.questions.filter((question) => question.variant);
      expect(areas.length, service.slug).toBeLessThanOrEqual(1);
      for (const question of areas) {
        expect(question.when, service.slug).toBeUndefined();
        expect(serviceVariants(service.slug)?.values.length ?? 0, service.slug).toBeGreaterThan(1);
      }
    }
  });

  it("has a local image for every category", () => {
    for (const category of CATEGORIES) {
      const image = CATEGORY_IMAGES[category.slug];
      expect(image, category.slug).toBeDefined();
      expect(existsSync(path.join(process.cwd(), "public", image.src))).toBe(true);
    }
  });

  it("finds new services and sub-options", () => {
    expect(searchServices("pimapen", 5).map((service) => service.slug)).toContain("pvc-pencere");
    expect(searchServices("su kaçağı", 5).map((service) => service.slug)).toContain("su-kacagi-tespiti");
    expect(searchServices("catering", 5).map((service) => service.slug)).toContain("catering");
    expect(parsePreset("ozel-ders", "spor:Tenis")).toEqual({ ders: "Spor", spor: "Tenis" });
  });
});
