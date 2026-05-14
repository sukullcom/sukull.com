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

/**
 * Sınavlar sekmesinde hangi LGS / TYT / YDT / … bölümlerinin listeleneceği
 * (içerik olsun/olmasın; başlık sızıntısını engellemek için UI tarafında kullan).
 */
export function examKeysForLearningPath(
  path: string | null | undefined
): Set<string> | "all" {
  if (!path || path === "full") {
    return "all";
  }
  if (path === "lgs") {
    return new Set<string>(["LGS"]);
  }
  if (path === "tyt_ayt") {
    return new Set<string>(["TYT", "AYT"]);
  }
  if (path === "adult") {
    return new Set<string>(["YDT", "KPSS", "ALES", "YDS"]);
  }
  return "all";
}

export const LEARNING_PATH_DAYS_BETWEEN_CHANGES = 30;

/** Okul/sınıf kilitleri ile aynı insan-dostu pencere — bkz. `lib/school-grade-lock.ts`. */
export const LEARNING_PATH_TRIAL_DAYS = 7;
export const LEARNING_PATH_LOW_POINTS_THRESHOLD = 500;

/**
 * NOT (eski hard-cap): Önceki `LEARNING_PATH_MAX_CHANGES = 5` sabiti kaldırıldı.
 * Anti-cheat zaten **iki katmanda** korunuyor:
 *   - 30 gün cooldown (puan-üstü hesaplar için sınırlı transfer)
 *   - <500 puan muafiyeti (henüz değer biriktirmemiş hesap zaten oyunlanmıyor)
 * "Ömür boyu 5 kez" sınırı meşru hayat değişikliklerinde (üniversite → KPSS,
 * sınıf atlama, vb.) kullanıcıyı sıkıştırıyordu. `learningPathChangeCount`
 * kolonu **telemetri** olarak korunuyor (anomali izleme), ama kullanıcı
 * akışında bir kapı değil.
 */

/** Okul tipi sekmeleri (liderlik tablosu okul listeleri). */
export type LeaderboardSchoolTab =
  | "university"
  | "high_school"
  | "secondary_school"
  | "elementary_school";

/**
 * Kullanıcının öğrenme yoluna göre hangi okul tipi tablarının gösterileceği.
 * `full`: eski hesaplar — hepsi.
 */
export function leaderboardSchoolTabsForPath(
  path: string | null | undefined,
): LeaderboardSchoolTab[] | "all" {
  if (!path || path === "full") return "all";
  if (path === "lgs") return ["secondary_school"];
  if (path === "tyt_ayt") return ["high_school"];
  if (path === "adult") return ["university"];
  return "all";
}

/** Study Buddy’de gösterilecek gönderi learning_path değerleri (viewer full ise hepsi). */
export function studyBuddyLearningPathsForViewer(
  viewerPath: string | null | undefined,
): string[] | "all" {
  if (!viewerPath || viewerPath === "full") return "all";
  return [viewerPath];
}

export function postMatchesStudyBuddySegment(
  viewerPath: string | null | undefined,
  postLearningPath: string | null | undefined,
): boolean {
  if (!viewerPath || viewerPath === "full") return true;
  const p = postLearningPath ?? "full";
  if (p === "full") return true;
  return viewerPath === p;
}

/** Seçilen okul satırı, öğrenme yolu ile uyumlu mu (Sunucu doğrulaması). */
export function schoolTypeMatchesLearningPath(
  schoolType: "elementary_school" | "secondary_school" | "high_school" | "university",
  path: LearningPath,
): boolean {
  if (path === "lgs") return schoolType === "secondary_school";
  if (path === "tyt_ayt") return schoolType === "high_school";
  if (path === "adult") return schoolType === "university";
  return true;
}

export type LearningPathExemption = "trial" | "low_points";

export type LearningPathChangeDecision = {
  allowed: boolean;
  nextAllowedAt: Date | null;
  reason: "ok" | "cooldown" | "incomplete";
  /** Hangi muafiyetin (varsa) izni verdiği — UI mesajı için. */
  exemption?: LearningPathExemption;
};

/**
 * Öğrenme yolunu değiştirebilir mi?
 *
 * Kurallar (`reason` ile bildirilir):
 *   - `incomplete`: onboarding tamamlanmamış → değiştiremez
 *   - `cooldown`: son değişimden 30 gün geçmemiş → muafiyet yoksa hayır
 *   - `ok`: serbest
 *
 * Muafiyetler (`options` ile geçilirse cooldown'ı atlatır; `incomplete`
 * muafiyet kabul etmez — onboarding olmadan değişim mantıksız):
 *   - `trial`: onboarding'in ilk 7 günü içindeyse cooldown atlanır
 *   - `low_points`: toplam puan < 500 ise cooldown atlanır
 *
 * `changeCount` parametresi imzayı geriye uyumlu tutmak için duruyor;
 * artık karar verirken kullanılmıyor (telemetri amaçlı DB'de tutulur).
 */
export function canChangeLearningPath(
  now: Date,
  onboardingCompletedAt: Date | null,
  lastSetAt: Date | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _changeCount: number,
  options?: {
    onboardingCompletedAt?: Date | null;
    totalPoints?: number | null;
  },
): LearningPathChangeDecision {
  if (!onboardingCompletedAt) {
    return { allowed: false, nextAllowedAt: null, reason: "incomplete" };
  }
  if (!lastSetAt) {
    return { allowed: true, nextAllowedAt: null, reason: "ok" };
  }
  const min = new Date(lastSetAt);
  min.setDate(min.getDate() + LEARNING_PATH_DAYS_BETWEEN_CHANGES);
  if (now >= min) {
    return { allowed: true, nextAllowedAt: null, reason: "ok" };
  }

  // Cooldown aktif — muafiyet kontrolü
  const onb = options?.onboardingCompletedAt ?? onboardingCompletedAt;
  if (onb) {
    const trialEnd = new Date(onb.getTime());
    trialEnd.setDate(trialEnd.getDate() + LEARNING_PATH_TRIAL_DAYS);
    if (now < trialEnd) {
      return { allowed: true, nextAllowedAt: null, reason: "ok", exemption: "trial" };
    }
  }
  if (
    typeof options?.totalPoints === "number" &&
    options.totalPoints < LEARNING_PATH_LOW_POINTS_THRESHOLD
  ) {
    return { allowed: true, nextAllowedAt: null, reason: "ok", exemption: "low_points" };
  }

  return { allowed: false, nextAllowedAt: min, reason: "cooldown" };
}
