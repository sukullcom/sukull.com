/**
 * Okul ve sınıf (student_grade) seçimi 6 ay kilidi — rekabet oyunlanmasını azaltır.
 *
 * Politika muafiyetleri (kullanıcı dostluğu için):
 *   1. **İlk hafta deneme**: Onboarding'i tamamlayan kullanıcı ilk 7 gün
 *      içinde okul/sınıf değişikliğini ücretsiz yapabilir. Yeni kullanıcı
 *      "yanlış seçtim, 6 ay sıkıştım" tuzağına düşmez.
 *   2. **Düşük puan**: <500 toplam puanı olan kullanıcılarda kilit yok.
 *      Anti-cheat motorunun amacı puan transferi/farmlamasını engellemek;
 *      henüz değer biriktirmemiş kullanıcının değiştirmesinden risk yok.
 *
 * Bu iki muafiyetin **alış-veriş**i: anti-cheat hâlâ aktif (puan eşiği
 * geçildikten sonra ve ilk hafta sonrası kilit yine devrede), ama kazara
 * yanlış seçim / yeni kullanıcı denemesi senaryosunda kullanıcı mağdur olmaz.
 */

export const SCHOOL_AND_GRADE_LOCK_MONTHS = 6;
export const SCHOOL_AND_GRADE_TRIAL_DAYS = 7;
export const SCHOOL_AND_GRADE_LOW_POINTS_THRESHOLD = 500;

export function addMonths(base: Date, months: number): Date {
  const d = new Date(base.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function nextLockExpiresAt(from: Date): Date {
  return addMonths(from, SCHOOL_AND_GRADE_LOCK_MONTHS);
}

export type LockDecision =
  | { allowed: true; exemption?: "trial" | "low_points" }
  | { allowed: false; nextAllowedAt: Date };

/**
 * Hesap "deneme penceresinde" mi (onboarding'in ilk 7 günü)?
 * `onboardingCompletedAt` null ise (henüz tamamlanmamış) trial uygulanmaz —
 * o akış zaten onboarding'in kendisi.
 */
function isInTrialPeriod(now: Date, onboardingCompletedAt: Date | null | undefined): boolean {
  if (!onboardingCompletedAt) return false;
  const trialEnd = addDays(onboardingCompletedAt, SCHOOL_AND_GRADE_TRIAL_DAYS);
  return now < trialEnd;
}

/**
 * Muafiyetlerin uygulanıp uygulanmayacağı tek noktada karar verilir.
 * `options` opsiyonel; verilmezse eski (sıkı) davranışa düşer ki testler ve
 * geriye dönük çağırıcılar bozulmasın.
 */
export type PolicyExemptionOptions = {
  onboardingCompletedAt?: Date | null;
  totalPoints?: number | null;
};

function checkExemption(
  now: Date,
  options: PolicyExemptionOptions | undefined,
): "trial" | "low_points" | null {
  if (!options) return null;
  if (isInTrialPeriod(now, options.onboardingCompletedAt ?? null)) return "trial";
  if (
    typeof options.totalPoints === "number" &&
    options.totalPoints < SCHOOL_AND_GRADE_LOW_POINTS_THRESHOLD
  ) {
    return "low_points";
  }
  return null;
}

/**
 * İlk okul ataması (null → id) her zaman serbest; sonrasında kilit dolana kadar değişmez.
 * `options` ile geçirilen muafiyetler (trial / low points) kilidi atlatabilir.
 */
export function canChangeSchoolSelection(
  now: Date,
  lockedUntil: Date | null | undefined,
  previousSchoolId: number | null | undefined,
  nextSchoolId: number | null,
  options?: PolicyExemptionOptions,
): LockDecision {
  if ((previousSchoolId ?? null) === (nextSchoolId ?? null)) {
    return { allowed: true };
  }
  if (previousSchoolId == null && nextSchoolId != null) {
    return { allowed: true };
  }
  if (!lockedUntil || now >= lockedUntil) {
    return { allowed: true };
  }
  const exemption = checkExemption(now, options);
  if (exemption) return { allowed: true, exemption };
  return { allowed: false, nextAllowedAt: lockedUntil };
}

/**
 * Sınıf değişimi (student_grade) — aynı mantık.
 */
export function canChangeStudentGradeSelection(
  now: Date,
  lockedUntil: Date | null | undefined,
  previousGrade: number | null | undefined,
  nextGrade: number | null,
  options?: PolicyExemptionOptions,
): LockDecision {
  if ((previousGrade ?? null) === (nextGrade ?? null)) {
    return { allowed: true };
  }
  if ((previousGrade == null || previousGrade === undefined) && nextGrade != null) {
    return { allowed: true };
  }
  if (!lockedUntil || now >= lockedUntil) {
    return { allowed: true };
  }
  const exemption = checkExemption(now, options);
  if (exemption) return { allowed: true, exemption };
  return { allowed: false, nextAllowedAt: lockedUntil };
}
