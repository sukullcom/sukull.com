// app/(main)/(protected)/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { getUserProgress } from "@/db/queries";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { Quests } from "@/components/quests";
import { DailyProgress } from "@/components/daily-progress";
import { checkStreakContinuity, getStreakCount } from "@/actions/daily-streak";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  // Run streak check FIRST so DB is up-to-date before getUserProgress reads it
  try {
    await checkStreakContinuity(user.id);
  } catch {
    // best-effort
  }

  const userProgress = await getUserProgress();
  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses?message=select-course");
  }

  // Fetch the actual current streak (post-reset) directly from DB
  const currentStreak = await getStreakCount(user.id);

  return (
    <div className="flex flex-row-reverse">
      <StickyWrapper>
        <UserProgress
          activeCourse={userProgress.activeCourse!}
          hearts={userProgress.hearts}
          points={userProgress.points}
          istikrar={currentStreak}
          hasInfiniteHearts={userProgress.hasInfiniteHearts || false}
        />

        <DailyProgress />
        <Quests
          currentStreak={currentStreak}
          achievements={{
            profileEditingUnlocked: userProgress.profileEditingUnlocked || false,
            studyBuddyUnlocked: userProgress.studyBuddyUnlocked || false,
            codeShareUnlocked: userProgress.codeShareUnlocked || false,
          }}
        />
      </StickyWrapper>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
