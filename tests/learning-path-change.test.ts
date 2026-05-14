import { describe, expect, it } from "vitest";
import {
  canChangeLearningPath,
  LEARNING_PATH_DAYS_BETWEEN_CHANGES,
  LEARNING_PATH_LOW_POINTS_THRESHOLD,
  LEARNING_PATH_MAX_CHANGES,
  LEARNING_PATH_TRIAL_DAYS,
} from "@/lib/learning-path";

const NOW = new Date("2026-06-01T12:00:00Z");

function daysAgo(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() - n);
  return x;
}

describe("canChangeLearningPath — temel davranış", () => {
  it("onboarding tamamlanmamış → incomplete", () => {
    const r = canChangeLearningPath(NOW, null, null, 0);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("incomplete");
  });

  it("max değişim hakkı tükenmiş → max", () => {
    const r = canChangeLearningPath(
      NOW,
      daysAgo(NOW, 365),
      daysAgo(NOW, 60),
      LEARNING_PATH_MAX_CHANGES,
    );
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("max");
  });

  it("hiç değişim yok → serbest", () => {
    const r = canChangeLearningPath(NOW, daysAgo(NOW, 60), null, 0);
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("ok");
  });

  it("cooldown bitmiş → serbest", () => {
    const r = canChangeLearningPath(
      NOW,
      daysAgo(NOW, 60),
      daysAgo(NOW, LEARNING_PATH_DAYS_BETWEEN_CHANGES + 1),
      1,
    );
    expect(r.allowed).toBe(true);
  });

  it("cooldown aktif + muafiyet yok → reddedildi", () => {
    const lastSet = daysAgo(NOW, 5);
    const r = canChangeLearningPath(NOW, daysAgo(NOW, 60), lastSet, 1);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("cooldown");
  });
});

describe("canChangeLearningPath — muafiyetler", () => {
  const cooldownActive = daysAgo(NOW, 5);

  it("trial: onboarding < 7 gün → exemption=trial", () => {
    const r = canChangeLearningPath(NOW, daysAgo(NOW, 60), cooldownActive, 1, {
      onboardingCompletedAt: daysAgo(NOW, 2),
      totalPoints: 1000,
    });
    expect(r.allowed).toBe(true);
    expect(r.exemption).toBe("trial");
  });

  it(`trial: onboarding tam ${LEARNING_PATH_TRIAL_DAYS}. günde → muafiyet yok`, () => {
    const r = canChangeLearningPath(NOW, daysAgo(NOW, 60), cooldownActive, 1, {
      onboardingCompletedAt: daysAgo(NOW, LEARNING_PATH_TRIAL_DAYS),
      totalPoints: 1000,
    });
    expect(r.allowed).toBe(false);
  });

  it("low_points: <500 → exemption=low_points", () => {
    const r = canChangeLearningPath(NOW, daysAgo(NOW, 60), cooldownActive, 1, {
      onboardingCompletedAt: daysAgo(NOW, 60),
      totalPoints: LEARNING_PATH_LOW_POINTS_THRESHOLD - 1,
    });
    expect(r.allowed).toBe(true);
    expect(r.exemption).toBe("low_points");
  });

  it("low_points: tam eşikte → muafiyet yok", () => {
    const r = canChangeLearningPath(NOW, daysAgo(NOW, 60), cooldownActive, 1, {
      onboardingCompletedAt: daysAgo(NOW, 60),
      totalPoints: LEARNING_PATH_LOW_POINTS_THRESHOLD,
    });
    expect(r.allowed).toBe(false);
  });

  it("max sınırı muafiyet kabul etmez (anti-cheat hard cap)", () => {
    const r = canChangeLearningPath(
      NOW,
      daysAgo(NOW, 365),
      daysAgo(NOW, 60),
      LEARNING_PATH_MAX_CHANGES,
      {
        onboardingCompletedAt: daysAgo(NOW, 1),
        totalPoints: 10,
      },
    );
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("max");
  });

  it("incomplete muafiyet kabul etmez (onboarding olmadan değişim mantıksız)", () => {
    const r = canChangeLearningPath(NOW, null, null, 0, {
      onboardingCompletedAt: daysAgo(NOW, 2),
      totalPoints: 10,
    });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("incomplete");
  });

  it("options yok → eski katı davranış (geriye uyumluluk)", () => {
    const r = canChangeLearningPath(NOW, daysAgo(NOW, 60), cooldownActive, 1);
    expect(r.allowed).toBe(false);
  });

  it("trial önce kontrol edilir (low_points ile çakıştığında)", () => {
    const r = canChangeLearningPath(NOW, daysAgo(NOW, 60), cooldownActive, 1, {
      onboardingCompletedAt: daysAgo(NOW, 1),
      totalPoints: 10,
    });
    expect(r.allowed).toBe(true);
    expect(r.exemption).toBe("trial");
  });
});
