/**
 * Okul ve sınıf (student_grade) seçimi 6 ay kilidi — rekabet oyunlanmasını azaltır.
 */

export const SCHOOL_AND_GRADE_LOCK_MONTHS = 6;

export function addMonths(base: Date, months: number): Date {
  const d = new Date(base.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

export function nextLockExpiresAt(from: Date): Date {
  return addMonths(from, SCHOOL_AND_GRADE_LOCK_MONTHS);
}

export type LockDecision =
  | { allowed: true }
  | { allowed: false; nextAllowedAt: Date };

/**
 * İlk okul ataması (null → id) her zaman serbest; sonrasında kilit dolana kadar değişmez.
 */
export function canChangeSchoolSelection(
  now: Date,
  lockedUntil: Date | null | undefined,
  previousSchoolId: number | null | undefined,
  nextSchoolId: number | null,
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
  return { allowed: false, nextAllowedAt: lockedUntil };
}
