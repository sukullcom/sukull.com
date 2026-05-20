/**
 * Okul master verisi UI sıralaması ve lise sınıf etiketleri.
 */

/** DB `schools.category` değerleri — okul türü dropdown sırası (Lise → Ortaokul → İlkokul → Üniversite). */
export const SCHOOL_CATEGORY_SORT_ORDER: Record<string, number> = {
  "High School": 0,
  "Secondary School": 1,
  "Primary School": 2,
  University: 3,
};

export type SchoolCategoryRow = { category: string; type?: string; count?: number };

export function sortSchoolCategories<T extends SchoolCategoryRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const oa = SCHOOL_CATEGORY_SORT_ORDER[a.category] ?? 99;
    const ob = SCHOOL_CATEGORY_SORT_ORDER[b.category] ?? 99;
    if (oa !== ob) return oa - ob;
    return a.category.localeCompare(b.category, "tr");
  });
}

export function getSchoolCategoryLabel(category: string): string {
  switch (category) {
    case "Primary School":
      return "İlkokul";
    case "Secondary School":
      return "Ortaokul";
    case "High School":
      return "Lise";
    case "University":
      return "Üniversite";
    default:
      return category;
  }
}

/** Lise (TYT/AYT) sınıf dropdown — değer yine 9; etiket hazırlık + 9. sınıfı kapsar. */
export const TYT_AYT_GRADE_OPTIONS: { value: number; label: string }[] = [
  { value: 9, label: "9. Sınıf/Hazırlık" },
  { value: 10, label: "10. sınıf" },
  { value: 11, label: "11. sınıf" },
  { value: 12, label: "12. sınıf" },
];

export function isValidTytAytStudentGrade(grade: number | null | undefined): boolean {
  if (grade == null) return false;
  return grade >= 9 && grade <= 12;
}

export function formatStudentGradeLabel(grade: number | null | undefined): string {
  if (grade == null) return "—";
  if (grade === 9) return "9. Sınıf/Hazırlık";
  return `${grade}. sınıf`;
}
