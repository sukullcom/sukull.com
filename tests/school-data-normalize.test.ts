import { describe, expect, it } from "vitest";
import {
  fixUniversityCity,
  foldDistrictKey,
  mergeDistrictAggregates,
  normalizeDistrictName,
  normalizeSchoolCsvRows,
  pickCanonicalDistrict,
} from "@/lib/school-data-normalize";

describe("fixUniversityCity", () => {
  it("üniversite adının şehir sütununa yazıldığı satırı İSTANBUL yapar", () => {
    expect(
      fixUniversityCity(
        "İstanbul Sağlık ve Sosyal Bilimler Meslek Yüksekokulu",
        "İstanbul Sağlık ve Sosyal Bilimler Meslek Yüksekokulu",
        "University",
      ),
    ).toBe("İSTANBUL");
  });
});

describe("mergeDistrictAggregates", () => {
  it("birleştirir BAGCILAR ve BAĞCILAR", () => {
    const merged = mergeDistrictAggregates([
      { district: "BAGCILAR", count: 3 },
      { district: "BAĞCILAR", count: 142 },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.district).toBe("BAĞCILAR");
    expect(merged[0]?.count).toBe(145);
  });
});

describe("district normalization", () => {
  it("BAGCILAR → BAĞCILAR", () => {
    expect(normalizeDistrictName("BAGCILAR", "İSTANBUL")).toBe("BAĞCILAR");
  });

  it("KADİKÖY → KADIKÖY (resmi büyük harf)", () => {
    expect(normalizeDistrictName("KADİKÖY", "İSTANBUL")).toBe("KADIKÖY");
  });

  it("fold eşleşen varyantlardan Türkçe karakterli olanı seçer", () => {
    expect(pickCanonicalDistrict(["BAGCILAR", "BAĞCILAR"])).toBe("BAĞCILAR");
    expect(foldDistrictKey("BAGCILAR")).toBe(foldDistrictKey("BAĞCILAR"));
  });
});

describe("normalizeSchoolCsvRows", () => {
  it("üniversite şehir + ilçe tekrarlarını düzeltir", () => {
    const { rows, cityFixes, districtMerges } = normalizeSchoolCsvRows([
      {
        city: "İstanbul Şişli Meslek Yüksekokulu",
        district: "Kampüs",
        category: "University",
        kind: "Foundation University",
        schoolName: "İstanbul Şişli Meslek Yüksekokulu",
      },
      {
        city: "İSTANBUL",
        district: "BAGCILAR",
        category: "High School",
        kind: "Lise",
        schoolName: "Test Lisesi",
      },
      {
        city: "İSTANBUL",
        district: "BAĞCILAR",
        category: "High School",
        kind: "Lise",
        schoolName: "Test Lisesi 2",
      },
    ]);
    expect(cityFixes).toBe(1);
    expect(districtMerges).toBeGreaterThanOrEqual(1);
    expect(rows.every((r) => r.city === "İSTANBUL")).toBe(true);
    expect(rows.filter((r) => r.category === "High School").map((r) => r.district)).toEqual([
      "BAĞCILAR",
      "BAĞCILAR",
    ]);
  });
});
