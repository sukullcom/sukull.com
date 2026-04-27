/**
 * Kullanıcı yolu → kurs listesi filtreleme (LGS, TYT/AYT, yetişkin sınav bantı).
 * `full`: eski hesaplar, filtre yok.
 */

import type { courses } from "@/db/schema";

export type LearningPath = "lgs" | "tyt_ayt" | "adult" | "full";

type Course = typeof courses.$inferSelect;

const EXAM_ORDER = [
  "LGS",
  "TYT",
  "AYT",
  "YDT",
  "KPSS",
  "ALES",
  "YDS",
] as const;

function parseGradeFromTitle(title: string): number | null {
  const m = title.match(/(\d+)\.\s*[Ss]ınıf/);
  return m ? parseInt(m[1], 10) : null;
}

function detectExamFromTitle(title: string): (typeof EXAM_ORDER)[number] | null {
  const t = title.toUpperCase();
  for (const k of EXAM_ORDER) {
    if (new RegExp(`\\b${k}\\b`).test(t)) return k;
  }
  return null;
}

function detectTopic(title: string): "ingilizce" | "diger" {
  const t = title.toLocaleLowerCase("tr");
  if (t.includes("ingilizce") || t.includes("english")) return "ingilizce";
  return "diger";
}

export function filterCoursesByLearningPath(
  allCourses: Course[],
  path: string | null | undefined,
  studentGrade: number | null | undefined
): Course[] {
  if (!path || path === "full") return allCourses;
  if (path === "adult") {
    return allCourses.filter((c) => {
      const exam = detectExamFromTitle(c.title);
      if (exam) return exam === "YDT" || exam === "KPSS" || exam === "ALES" || exam === "YDS";
      const g = parseGradeFromTitle(c.title);
      if (g !== null) return false; // 5–12 sınıf bloku
      if (detectTopic(c.title) === "ingilizce") return true; // CEFR vb.
      return false;
    });
  }
  if (path === "lgs" || path === "tyt_ayt") {
    const g =
      studentGrade && studentGrade >= 5 && studentGrade <= 12
        ? studentGrade
        : null;
    return allCourses.filter((c) => {
      const exam = detectExamFromTitle(c.title);
      if (exam) {
        if (path === "lgs") return exam === "LGS";
        return exam === "TYT" || exam === "AYT";
      }
      const grade = parseGradeFromTitle(c.title);
      if (grade !== null) {
        if (path === "lgs") {
          if (g === null) return grade >= 5 && grade <= 8;
          return grade === g;
        }
        if (g === null) return grade >= 9 && grade <= 12;
        return grade === g;
      }
      // Konu: İngilizce herkese; diğer sınıf denkliği olmayan dersler sadece full
      return detectTopic(c.title) === "ingilizce";
    });
  }
  return allCourses;
}

export const LEARNING_PATH_DAYS_BETWEEN_CHANGES = 30;
export const LEARNING_PATH_MAX_CHANGES = 5;

export function canChangeLearningPath(
  now: Date,
  onboardingCompletedAt: Date | null,
  lastSetAt: Date | null,
  changeCount: number
): { allowed: boolean; nextAllowedAt: Date | null; reason: "ok" | "cooldown" | "max" | "incomplete" } {
  if (!onboardingCompletedAt) {
    return { allowed: false, nextAllowedAt: null, reason: "incomplete" };
  }
  if (changeCount >= LEARNING_PATH_MAX_CHANGES) {
    return { allowed: false, nextAllowedAt: null, reason: "max" };
  }
  if (!lastSetAt) {
    return { allowed: true, nextAllowedAt: null, reason: "ok" };
  }
  const min = new Date(lastSetAt);
  min.setDate(min.getDate() + LEARNING_PATH_DAYS_BETWEEN_CHANGES);
  if (now >= min) {
    return { allowed: true, nextAllowedAt: null, reason: "ok" };
  }
  return { allowed: false, nextAllowedAt: min, reason: "cooldown" };
}
