"use server";

import db from "@/db/drizzle";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
import { canChangeLearningPath, type LearningPath } from "@/lib/learning-path";
import { revalidatePath } from "next/cache";
import { users } from "@/utils/users";
import { redirect } from "next/navigation";

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
  studentGrade: number | null
): Promise<CompleteOnboardingState> {
  const user = await getServerUser();
  if (!user) {
    return { ok: false, error: "Giriş yapmanız gerekiyor." };
  }
  const v = validatePath(pathRaw, studentGrade);
  if (!v.ok) {
    return { ok: false, error: v.error };
  }
  const userId = user.id;
  const now = new Date();
  const profile = await users.getUser(userId).catch(() => null);
  const userName = profile?.name || (user.user_metadata as { full_name?: string })?.full_name || "User";
  const existing = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId) });
  if (existing?.onboardingCompletedAt) {
    return { ok: false, error: "Yolunuz zaten belirlenmiş. Profil üzerinden değiştirebilirsiniz." };
  }

  if (existing) {
    await db
      .update(userProgress)
      .set({
        learningPath: v.path,
        studentGrade: v.grade,
        onboardingCompletedAt: now,
        learningPathLastSetAt: now,
        userName: existing.userName || userName,
      })
      .where(eq(userProgress.userId, userId));
  } else {
    await db.insert(userProgress).values({
      userId,
      userName,
      userImageSrc: "/mascot_purple.svg",
      learningPath: v.path,
      studentGrade: v.grade,
      onboardingCompletedAt: now,
      learningPathLastSetAt: now,
      learningPathChangeCount: 0,
    });
  }

  revalidatePath("/courses");
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

  await db
    .update(userProgress)
    .set({
      learningPath: v.path,
      studentGrade: v.grade,
      learningPathLastSetAt: now,
      learningPathChangeCount: (row.learningPathChangeCount ?? 0) + 1,
    })
    .where(eq(userProgress.userId, user.id));

  revalidatePath("/courses");
  revalidatePath("/profile");
  return { ok: true };
}
