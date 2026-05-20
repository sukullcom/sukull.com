import { describe, expect, it } from "vitest";
import {
  formatStudentGradeLabel,
  isValidTytAytStudentGrade,
  sortSchoolCategories,
  TYT_AYT_GRADE_OPTIONS,
} from "@/lib/school-catalog";

describe("sortSchoolCategories", () => {
  it("orders Lise → Ortaokul → İlkokul → Üniversite", () => {
    const sorted = sortSchoolCategories([
      { category: "Primary School" },
      { category: "University" },
      { category: "High School" },
      { category: "Secondary School" },
    ]);
    expect(sorted.map((r) => r.category)).toEqual([
      "High School",
      "Secondary School",
      "Primary School",
      "University",
    ]);
  });
});

describe("tyt_ayt grades", () => {
  it("9. seçenek tek satır: 9. Sınıf/Hazırlık (value=9)", () => {
    expect(TYT_AYT_GRADE_OPTIONS[0]).toEqual({ value: 9, label: "9. Sınıf/Hazırlık" });
    expect(TYT_AYT_GRADE_OPTIONS).toHaveLength(4);
  });

  it("accepts 9–12 only", () => {
    expect(isValidTytAytStudentGrade(9)).toBe(true);
    expect(isValidTytAytStudentGrade(0)).toBe(false);
    expect(isValidTytAytStudentGrade(8)).toBe(false);
  });

  it("formats grade 9 with combined label", () => {
    expect(formatStudentGradeLabel(9)).toBe("9. Sınıf/Hazırlık");
    expect(formatStudentGradeLabel(10)).toBe("10. sınıf");
  });
});
