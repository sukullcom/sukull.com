import "server-only";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { getUserProgress } from "@/db/queries";

/**
 * `(main)/(protected)/layout.tsx` zaten şu garantileri sağlar:
 *   1. Oturum açmış kullanıcı.
 *   2. Aktif kursa sahip userProgress.
 *
 * Child page'lerde aynı kontrolleri tekrar yazmak yerine bu helper'ı kullanın.
 * `getServerUser()` ve `getUserProgress()` her ikisi de `cache()` altında
 * olduğundan bu çağrı ek DB maliyeti yaratmaz — sadece layout'un dönen
 * değerine tipli erişim sağlar.
 */
export async function getProtectedContext() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const userProgress = await getUserProgress();
  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses?message=select-course");
  }

  return {
    user,
    userProgress,
    activeCourse: userProgress.activeCourse,
  };
}

export type ProtectedContext = Awaited<ReturnType<typeof getProtectedContext>>;
