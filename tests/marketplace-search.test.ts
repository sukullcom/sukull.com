import { describe, expect, it } from "vitest";

import { requestCode, requestState, revealContact } from "@/lib/marketplace/format";
import { cleanFilters, requestMatchesEntry, serviceVariants, variantMatchesQuery } from "@/lib/marketplace/provider-match";
import { requestNeedsPlace } from "@/lib/marketplace/validate-request";
import { parsePreset, searchServices, searchSuggestions, suggestionHref } from "@/lib/marketplace/search";
import { normalizeRequestAnswers, resolveExpiry } from "@/lib/marketplace/validate-request";
import { safeNextPath } from "@/lib/safe-next";

describe("marketplace search", () => {
  it("suggests car-related services for araba", () => {
    const names = searchServices("araba", 8).map((service) => service.slug);
    expect(names).toContain("direksiyon-dersi");
    expect(names).toContain("arac-kaplama");
    expect(names).toContain("arac-kiralama");
  });

  it("finds oyun ablası and kodlama", () => {
    expect(searchServices("oyun ablasi", 8).map((service) => service.slug)).toContain("oyun-ablasi");
    expect(searchServices("kodlama", 8).map((service) => service.slug)).toContain("ozel-ders");
  });

  it("finds everyday plumbing from tesisat", () => {
    expect(searchServices("tesisat", 8).map((service) => service.slug)).toContain("su-tesisati");
  });

  it("returns popular services when the query is empty", () => {
    expect(searchServices("").length).toBeGreaterThan(0);
  });

  it("finds subjects by meaning when the user types ders", () => {
    const items = searchSuggestions("ders", 12);
    expect(items[0]?.service.slug).toBe("ozel-ders");
    const math = items.find((item) => item.label === "Matematik");
    expect(math?.preset).toEqual({ questionId: "ders", value: "Matematik" });
    expect(suggestionHref(math!)).toBe("/talep/yeni?hizmet=ozel-ders&on=ders%3AMatematik");
  });

  it("starts a lesson request from a subject name", () => {
    const items = searchSuggestions("matematik", 5);
    expect(items[0]).toMatchObject({ label: "Matematik", preset: { questionId: "ders", value: "Matematik" } });
    expect(searchServices("temizlikçi", 5).map((service) => service.slug)).toContain("ev-temizligi");
    expect(searchServices("musluk", 5).map((service) => service.slug)).toContain("su-tesisati");
  });

  it("accepts only real options as presets", () => {
    expect(parsePreset("ozel-ders", "ders:Matematik")).toEqual({ ders: "Matematik" });
    expect(parsePreset("ozel-ders", "ders:Bilinmeyen")).toEqual({});
    expect(parsePreset("ozel-ders", "details:x")).toEqual({});
  });
});

describe("provider service variants", () => {
  it("matches a lesson subject directly or through a school level", () => {
    const math = { variants: ["Matematik"] };
    expect(requestMatchesEntry("ozel-ders", math, [{ id: "ders", answer: "Matematik" }])).toBe(true);
    expect(
      requestMatchesEntry("ozel-ders", math, [
        { id: "ders", answer: "Ortaokul" },
        { id: "okul-dersi", answer: "Matematik" },
      ]),
    ).toBe(true);
    expect(requestMatchesEntry("ozel-ders", math, [{ id: "ders", answer: "Enstrüman" }])).toBe(false);
    expect(
      requestMatchesEntry("ozel-ders", { variants: ["Yabancı dil"] }, [
        { id: "ders", answer: "Lise" },
        { id: "okul-dersi", answer: "İngilizce" },
      ]),
    ).toBe(true);
  });

  it("ignores details like place or size", () => {
    expect(requestMatchesEntry("fayans", { variants: ["50"] }, [{ id: "metrekare", answer: "200" }])).toBe(true);
    expect(requestMatchesEntry("ozel-ders", {}, [{ id: "ders", answer: "Dans" }])).toBe(true);
    expect(requestMatchesEntry("yazilim-projesi", { variants: ["Oyun geliştirme"] }, [{ id: "tur", answer: "Oyun geliştirme" }])).toBe(true);
    expect(requestMatchesEntry("yazilim-projesi", { variants: ["Oyun geliştirme"] }, [{ id: "tur", answer: "Veri analizi" }])).toBe(false);
    expect(requestMatchesEntry("yazilim-projesi", { variants: ["Veri analizi"] }, [{ id: "tur", answer: "Oyun geliştirme, Veri analizi" }])).toBe(true);
    expect(
      requestMatchesEntry("yazilim-projesi", { variants: ["Android"] }, [
        { id: "tur", answer: "Veri analizi" },
        { id: "platform", answer: "Web sitesi" },
      ]),
    ).toBe(true);
  });

  it("finds a variant by a related word", () => {
    expect(variantMatchesQuery("ozel-ders", "Bağlama", "saz")).toBe(true);
    expect(variantMatchesQuery("ozel-ders", "Gitar", "enstruman")).toBe(true);
    expect(variantMatchesQuery("ozel-ders", "Gitar", "organizasyon")).toBe(false);
    expect(variantMatchesQuery("ozel-ders", "Matematik", "matem")).toBe(true);
  });

  it("lets a teacher pick single instruments and languages", () => {
    const guitar = { variants: ["Gitar"] };
    const ask = (answers: Record<string, string>) =>
      Object.entries(answers).map(([id, answer]) => ({ id, answer }));
    expect(requestMatchesEntry("ozel-ders", guitar, ask({ ders: "Enstrüman", enstruman: "Gitar" }))).toBe(true);
    expect(requestMatchesEntry("ozel-ders", guitar, ask({ ders: "Enstrüman", enstruman: "Piyano" }))).toBe(false);
    expect(requestMatchesEntry("ozel-ders", guitar, ask({ ders: "Enstrüman", enstruman: "Diğer" }))).toBe(true);
    expect(requestMatchesEntry("ozel-ders", guitar, ask({ ders: "Enstrüman" }))).toBe(true);
    const english = { variants: ["İngilizce"] };
    expect(requestMatchesEntry("ozel-ders", english, ask({ ders: "Yabancı dil", dil: "İngilizce" }))).toBe(true);
    expect(requestMatchesEntry("ozel-ders", english, ask({ ders: "Lise", "okul-dersi": "İngilizce" }))).toBe(true);
    expect(requestMatchesEntry("ozel-ders", english, ask({ ders: "Yabancı dil", dil: "Almanca" }))).toBe(false);
  });

  it("matches unclear answers to any chosen variant", () => {
    expect(requestMatchesEntry("beyaz-esya", { variants: ["Fırın"] }, [{ id: "cihaz", answer: "Diğer" }])).toBe(true);
    expect(requestMatchesEntry("fotografci", { variants: ["Ürün"] }, [{ id: "tur", answer: "Mekan ve emlak" }])).toBe(false);
  });

  it("shows psychologist requests only to matching specialties", () => {
    const child = { variants: ["Çocuk psikoloğu", "Ergen psikoloğu"] };
    const answers = (alan: string) => [
      { id: "nasil", answer: "Online" },
      { id: "alan", answer: alan },
    ];
    expect(requestMatchesEntry("psikolog", child, answers("Depresyon"))).toBe(false);
    expect(requestMatchesEntry("psikolog", child, answers("Depresyon, Ergen psikoloğu"))).toBe(true);
    expect(requestMatchesEntry("psikolog", child, answers("Diğer"))).toBe(true);
    expect(requestMatchesEntry("psikolog", {}, answers("Depresyon"))).toBe(true);
    expect(requestNeedsPlace("psikolog", answers("Depresyon"))).toBe(false);
    expect(variantMatchesQuery("psikolog", "Kaygı ve korku bozukluğu (anksiyete)", "anksiyete")).toBe(true);
  });

  it("labels variants without doubling the suffix", () => {
    const kaplama = serviceVariants("arac-kaplama");
    expect(kaplama?.label("Seramik kaplama")).toBe("Seramik kaplama");
    expect(kaplama?.label("PPF")).toBe("PPF kaplama");
    expect(serviceVariants("beyaz-esya")?.label("Buzdolabı")).toBe("Buzdolabı tamiri");
  });

  it("expands old group names and keeps only known variants", () => {
    const languages = serviceVariants("ozel-ders")?.groups.find((group) => group.title === "Yabancı dil")?.values ?? [];
    expect(cleanFilters("ozel-ders", { variants: ["Matematik", "Yabancı dil"] }).variants).toEqual([
      "Matematik",
      ...languages,
    ]);
    expect(cleanFilters("ozel-ders", { variants: ["Matematik", "Yok", "Ortaokul"] })).toEqual({ variants: ["Matematik"] });
    expect(cleanFilters("fayans", { variants: ["50"] })).toEqual({});
    expect(serviceVariants("ozel-ders")?.values).toContain("Fizik");
    expect(serviceVariants("ozel-ders")?.values).not.toContain("Lise");
    expect(serviceVariants("ozel-ders")?.values).not.toContain("Diğer");
  });

  it("presets a follow-up question together with its parent", () => {
    expect(parsePreset("ozel-ders", "enstruman:Gitar")).toEqual({ ders: "Enstrüman", enstruman: "Gitar" });
  });
});

describe("request state", () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);
  it("maps review and quote states to the customer dot", () => {
    expect(requestState({ status: "pending", quoteCount: 0, expiresAt: future })).toMatchObject({ tone: "yellow", label: "İncelemede" });
    expect(requestState({ status: "open", quoteCount: 1, expiresAt: future })).toMatchObject({ tone: "green", label: "Aktif" });
    expect(requestState({ status: "open", quoteCount: 4, expiresAt: future })).toMatchObject({ tone: "blue" });
    expect(requestState({ status: "rejected", quoteCount: 0, expiresAt: future })).toMatchObject({ tone: "red", expired: false });
    expect(requestState({ status: "open", quoteCount: 0, expiresAt: past }).expired).toBe(true);
  });
});

describe("request code", () => {
  it("hides the sequence and never collides", () => {
    const codes = new Set(Array.from({ length: 5000 }, (_, index) => requestCode(index + 1)));
    expect(codes.size).toBe(5000);
    expect(requestCode(1)).toMatch(/^SK-[0-9A-Z]{6}$/);
    expect(requestCode(1)).not.toContain("000001");
  });
});

describe("online place", () => {
  it("skips location only when the answer is online", () => {
    expect(requestNeedsPlace("psikolog", [{ id: "nasil", answer: "Online" }])).toBe(false);
    expect(requestNeedsPlace("ozel-ders", [{ id: "nasil", answer: "Online" }])).toBe(false);
    expect(requestNeedsPlace("ozel-ders", [{ id: "nasil", answer: "Kendi evinde" }])).toBe(true);
    expect(requestNeedsPlace("boya-badana", [])).toBe(true);
  });
});

describe("quote contact", () => {
  it("reveals only the chosen channel", () => {
    expect(revealContact("phone", "+905551112233", "a@b.com")).toEqual({
      label: "Telefon",
      value: "+905551112233",
    });
    expect(revealContact("email", "+905551112233", "a@b.com")?.value).toBe("a@b.com");
    expect(revealContact(null, "+905551112233", "a@b.com")).toBeNull();
  });
});

describe("request validation", () => {
  it("keeps the room question only for full-home moves", () => {
    const skipped = normalizeRequestAnswers({
      serviceSlug: "nakliyat",
      answers: [
        { id: "tur", answer: "Hamal" },
        { id: "oda", answer: "2+1" },
      ],
      details: "Bir koltuk ve buzdolabı taşınacak.",
      timing: "two_months",
    });
    expect(skipped.ok).toBe(true);
    if (skipped.ok) {
      expect(skipped.answers.map((answer) => answer.id)).toEqual(["tur"]);
    }
  });

  it("rejects a scheduled time beyond three weeks", () => {
    const far = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString();
    const result = resolveExpiry("scheduled", far);
    expect(result.ok).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows in-app paths and rejects open redirects", () => {
    expect(safeNextPath("/islerim")).toBe("/islerim");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
  });
});
