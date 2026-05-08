"use server";

import db from "@/db/drizzle";
import { schools, userProgress, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
import {
  canChangeLearningPath,
  schoolTypeMatchesLearningPath,
  type LearningPath,
} from "@/lib/learning-path";
import { canChangeStudentGradeSelection, nextLockExpiresAt } from "@/lib/school-grade-lock";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { flushDeferredReferralRewardsForReferrer } from "@/lib/referral-grant";

function validatePath(path: string, grade: number | null): { ok: true; path: LearningPath; grade: number | null } | { ok: false; error: string } {
  if (path === "adult") {
    return { ok: true, path: "adult", grade: null };
  }
  if (path === "lgs") {
    if (grade == null || grade < 5 || grade > 8) {
      return { ok: false, error: "5–8. sınıf seçmelisiniz." };
    }
    return { ok: true, path: "lgs", grade };
  }
  if (path === "tyt_ayt") {
    if (grade == null || grade < 9 || grade > 12) {
      return { ok: false, error: "9–12. sınıf seçmelisiniz." };
    }
    return { ok: true, path: "tyt_ayt", grade };
  }
  return { ok: false, error: "Geçersiz yol." };
}

export type CompleteOnboardingState = { ok: true } | { ok: false; error: string };

export async function completeLearningPath(
  pathRaw: string,
  studentGrade: number | null,
  schoolId: number | null,
): Promise<CompleteOnboardingState> {
  const user = await getServerUser();
  if (!user) {
    return { ok: false, error: "Giriş yapmanız gerekiyor." };
  }
  const v = validatePath(pathRaw, studentGrade);
  if (!v.ok) {
    return { ok: false, error: v.error };
  }
  if ((v.path === "lgs" || v.path === "tyt_ayt") && schoolId == null) {
    return { ok: false, error: "Ortaokul ve lise için bir okul seçmelisiniz." };
  }

  let resolvedSchoolId: number | null = schoolId;
  if (schoolId != null) {
    const schoolRow = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId),
    });
    if (!schoolRow) {
      return { ok: false, error: "Seçilen okul bulunamadı." };
    }
    if (!schoolTypeMatchesLearningPath(schoolRow.type, v.path)) {
      return {
        ok: false,
        error:
          v.path === "lgs"
            ? "Ortaokul öğrencileri yalnızca ortaokul kayıtlı okulları seçebilir."
            : v.path === "tyt_ayt"
              ? "Lise öğrencileri yalnızca lise kayıtlı okulları seçebilir."
              : "Üniversite / sınav yolu için yalnızca üniversite kayıtlı okulları seçebilirsiniz.",
      };
    }
  }

  const userId = user.id;
  const now = new Date();
  const profile = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true },
  });
  const userName = profile?.name || (user.user_metadata as { full_name?: string })?.full_name || "User";
  const existing = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
  if (existing?.onboardingCompletedAt) {
    return { ok: false, error: "Yolunuz zaten belirlenmiş. Profil üzerinden değiştirebilirsiniz." };
  }

  const schoolLock = resolvedSchoolId != null ? nextLockExpiresAt(now) : null;
  const gradeLock = v.grade != null ? nextLockExpiresAt(now) : null;

  if (existing) {
    await db
      .update(userProgress)
      .set({
        learningPath: v.path,
        studentGrade: v.grade,
        schoolId: resolvedSchoolId,
        onboardingCompletedAt: now,
        learningPathLastSetAt: now,
        userName: existing.userName || userName,
        schoolChangeLockedUntil: schoolLock,
        studentGradeChangeLockedUntil: gradeLock,
      })
      .where(eq(userProgress.userId, userId));
  } else {
    await db.insert(userProgress).values({
      userId,
      userName,
      userImageSrc: "/mascot_purple.svg",
      learningPath: v.path,
      studentGrade: v.grade,
      schoolId: resolvedSchoolId,
      onboardingCompletedAt: now,
      learningPathLastSetAt: now,
      learningPathChangeCount: 0,
      schoolChangeLockedUntil: schoolLock,
      studentGradeChangeLockedUntil: gradeLock,
    });
  }

  await flushDeferredReferralRewardsForReferrer(userId);

  revalidatePath("/courses");
  revalidatePath("/shop");
  revalidatePath("/leaderboard");
  revalidatePath("/onboarding");
  revalidatePath("/");
  return { ok: true };
}

export type UpdateLearningPathState = { ok: true } | { ok: false; error: string; nextAllowedAt?: string | null };

export async function updateLearningPathFromSettings(
  pathRaw: string,
  studentGrade: number | null
): Promise<UpdateLearningPathState> {
  const user = await getServerUser();
  if (!user) {
    return { ok: false, error: "Giriş yapmanız gerekiyor." };
  }
  const v = validatePath(pathRaw, studentGrade);
  if (!v.ok) {
    return { ok: false, error: v.error };
  }
  const now = new Date();
  const row = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, user.id) });
  if (!row?.onboardingCompletedAt) {
    redirect("/onboarding");
  }
  const lastSet = row.learningPathLastSetAt ?? null;
  const onb = row.onboardingCompletedAt ?? null;
  const ch = canChangeLearningPath(
    now,
    onb,
    lastSet,
    row.learningPathChangeCount ?? 0
  );
  if (!ch.allowed) {
    if (ch.reason === "max") {
      return { ok: false, error: "En fazla beş kez yol değişikliği yapılabiliyor. Destek’ten yardım alabilirsiniz." };
    }
    if (ch.reason === "cooldown" && ch.nextAllowedAt) {
      return { ok: false, error: "Bir sonraki değişim için 30 gün geçmesi gerekir.", nextAllowedAt: ch.nextAllowedAt.toISOString() };
    }
    return { ok: false, error: "Şu anda yolunuzu değiştiremiyoruz." };
  }

  const same = row.learningPath === v.path && (row.studentGrade ?? null) === (v.grade ?? null);
  if (same) {
    return { ok: true };
  }

  const gradeChanging = (row.studentGrade ?? null) !== (v.grade ?? null);
  if (gradeChanging) {
    const gradeDecision = canChangeStudentGradeSelection(
      now,
      row.studentGradeChangeLockedUntil ?? null,
      row.studentGrade,
      v.grade,
    );
    if (!gradeDecision.allowed) {
      return {
        ok: false,
        error: `Sınıf değişikliği için ${gradeDecision.nextAllowedAt.toLocaleDateString("tr-TR")} tarihine kadar beklemelisiniz.`,
        nextAllowedAt: gradeDecision.nextAllowedAt.toISOString(),
      };
    }
  }

  await db
    .update(userProgress)
    .set({
      learningPath: v.path,
      studentGrade: v.grade,
      learningPathLastSetAt: now,
      learningPathChangeCount: (row.learningPathChangeCount ?? 0) + 1,
      ...(gradeChanging
        ? { studentGradeChangeLockedUntil: nextLockExpiresAt(now) }
        : {}),
    })
    .where(eq(userProgress.userId, user.id));

  revalidatePath("/courses");
  revalidatePath("/profile");
  return { ok: true };
}
