// app/(main)/(protected)/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { getUserProgress } from "@/db/queries";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { Quests } from "@/components/quests";

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
    // Optionally redirect if no progress row yet, or do nothing
    redirect("/courses");
  }

  // 3) Render a single layout with your “sidebar” or “sticky” progress
  return (
    <div className="flex flex-row-reverse">
      <StickyWrapper>
        {userProgress ? (
          <UserProgress
            activeCourse={userProgress.activeCourse!}
            hearts={userProgress.hearts}
            points={userProgress.points}
            istikrar={userProgress.istikrar}
            hasActiveSubscription={false}
          />
        ) : null}

          <Quests points={userProgress.points} />
      </StickyWrapper>

      {/* The main content from each nested page */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
