import { describe, expect, it } from "vitest";
import {
  canChangeSchoolSelection,
  canChangeStudentGradeSelection,
  nextLockExpiresAt,
  SCHOOL_AND_GRADE_TRIAL_DAYS,
  SCHOOL_AND_GRADE_LOW_POINTS_THRESHOLD,
} from "@/lib/school-grade-lock";

const NOW = new Date("2026-06-01T12:00:00Z");

function daysAgo(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() - n);
  return x;
}

describe("canChangeSchoolSelection — temel kilit", () => {
  it("ilk atama (null → id) her zaman serbest", () => {
    const r = canChangeSchoolSelection(NOW, null, null, 7);
    expect(r).toEqual({ allowed: true });
  });

  it("aynı okul seçilmesi serbest (no-op)", () => {
    const r = canChangeSchoolSelection(
      NOW,
      new Date(NOW.getTime() + 86400000),
      7,
      7,
    );
    expect(r).toEqual({ allowed: true });
  });

  it("kilit dolduktan sonra değişim serbest", () => {
    const expired = daysAgo(NOW, 1);
    const r = canChangeSchoolSelection(NOW, expired, 7, 8);
    expect(r).toEqual({ allowed: true });
  });

  it("kilit aktifken ve muafiyet yokken reddeder", () => {
    const future = new Date(NOW.getTime() + 30 * 86400000);
    const r = canChangeSchoolSelection(NOW, future, 7, 8);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.nextAllowedAt).toEqual(future);
  });
});

describe("canChangeSchoolSelection — muafiyetler", () => {
  const lockedUntil = new Date(NOW.getTime() + 30 * 86400000);

  it("trial: onboarding < 7 gün önce → exemption=trial", () => {
    const r = canChangeSchoolSelection(NOW, lockedUntil, 7, 8, {
      onboardingCompletedAt: daysAgo(NOW, 3),
      totalPoints: 1000, // yüksek puan; trial bunu override etmeli
    });
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.exemption).toBe("trial");
  });

  it(`trial: onboarding tam ${SCHOOL_AND_GRADE_TRIAL_DAYS}. günde → muafiyet biter`, () => {
    const r = canChangeSchoolSelection(NOW, lockedUntil, 7, 8, {
      onboardingCompletedAt: daysAgo(NOW, SCHOOL_AND_GRADE_TRIAL_DAYS),
      totalPoints: 1000,
    });
    expect(r.allowed).toBe(false);
  });

  it("low_points: 500 altı → exemption=low_points", () => {
    const r = canChangeSchoolSelection(NOW, lockedUntil, 7, 8, {
      onboardingCompletedAt: daysAgo(NOW, 60),
      totalPoints: SCHOOL_AND_GRADE_LOW_POINTS_THRESHOLD - 1,
    });
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.exemption).toBe("low_points");
  });

  it("low_points: tam eşikte → muafiyet yok", () => {
    const r = canChangeSchoolSelection(NOW, lockedUntil, 7, 8, {
      onboardingCompletedAt: daysAgo(NOW, 60),
      totalPoints: SCHOOL_AND_GRADE_LOW_POINTS_THRESHOLD,
    });
    expect(r.allowed).toBe(false);
  });

  it("options yok → eski katı davranış (geriye uyumluluk)", () => {
    const r = canChangeSchoolSelection(NOW, lockedUntil, 7, 8);
    expect(r.allowed).toBe(false);
  });

  it("trial muafiyeti exemption alanını döndürüyor (kilit reset için sinyal)", () => {
    const r = canChangeSchoolSelection(NOW, lockedUntil, 7, 8, {
      onboardingCompletedAt: daysAgo(NOW, 1),
      totalPoints: 50,
    });
    expect(r.allowed).toBe(true);
    if (r.allowed) {
      // Hangi muafiyet kullanıldı? Trial önce kontrol edilir.
      expect(r.exemption).toBe("trial");
    }
  });
});

describe("canChangeStudentGradeSelection — muafiyetler", () => {
  const lockedUntil = new Date(NOW.getTime() + 30 * 86400000);

  it("trial: ilk hafta değişim serbest", () => {
    const r = canChangeStudentGradeSelection(NOW, lockedUntil, 9, 10, {
      onboardingCompletedAt: daysAgo(NOW, 2),
      totalPoints: 1000,
    });
    expect(r.allowed).toBe(true);
  });

  it("low_points: <500 → serbest", () => {
    const r = canChangeStudentGradeSelection(NOW, lockedUntil, 9, 10, {
      onboardingCompletedAt: daysAgo(NOW, 60),
      totalPoints: 100,
    });
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.exemption).toBe("low_points");
  });

  it("yüksek puanlı + trial sonrası kilit aktif", () => {
    const r = canChangeStudentGradeSelection(NOW, lockedUntil, 9, 10, {
      onboardingCompletedAt: daysAgo(NOW, 60),
      totalPoints: 5000,
    });
    expect(r.allowed).toBe(false);
  });

  it("önceki grade null + next non-null serbest (ilk atama)", () => {
    const r = canChangeStudentGradeSelection(NOW, lockedUntil, null, 9);
    expect(r).toEqual({ allowed: true });
  });
});

describe("nextLockExpiresAt", () => {
  it("6 ay sonrasını döndürür", () => {
    const r = nextLockExpiresAt(NOW);
    expect(r.getUTCMonth()).toBe((NOW.getUTCMonth() + 6) % 12);
  });
});
