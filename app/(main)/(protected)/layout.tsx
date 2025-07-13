// app/(main)/(protected)/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { getUserProgress } from "@/db/queries";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { Quests } from "@/components/quests";
import { DailyProgress } from "@/components/daily-progress";
import { checkStreakContinuity } from "@/actions/daily-streak";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 1) Check session
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  // 2) Load user progress. (If you want to allow partial usage, skip the redirect.)
  const userProgress = await getUserProgress();
  if (!userProgress || !userProgress.activeCourse) {
    // Redirect to courses page with a toast message
    redirect("/courses?message=select-course");
  }

  // 3) Check streak continuity for the user whenever they access the protected area
  // This ensures streaks are reset if they missed daily goals
  try {
    await checkStreakContinuity(user.id);
  } catch {
    // Ignore errors from setting avatar in localStorage
  }

  // 4) Render a single layout with your "sidebar" or "sticky" progress
  return (
    <div className="flex flex-row-reverse">
      <StickyWrapper>
        {userProgress ? (
          <UserProgress
            activeCourse={userProgress.activeCourse!}
            hearts={userProgress.hearts}
            points={userProgress.points}
            istikrar={userProgress.istikrar}
            hasInfiniteHearts={userProgress.hasInfiniteHearts || false}
          />
        ) : null}

        <DailyProgress />
        <Quests 
          currentStreak={userProgress.istikrar}
          achievements={{
            profileEditingUnlocked: userProgress.profileEditingUnlocked || false,
            studyBuddyUnlocked: userProgress.studyBuddyUnlocked || false,
            codeShareUnlocked: userProgress.codeShareUnlocked || false,
          }}
        />
      </StickyWrapper>

      {/* The main content from each nested page */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
