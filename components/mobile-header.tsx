import { getUserProgress } from "@/db/queries";
import { getServerUser } from "@/lib/auth";
import { getStreakCount } from "@/actions/daily-streak";
import { UserProgress } from "./user-progress";

export const MobileHeader = async () => {
  const user = await getServerUser();
  if (!user) return null;

  const userProgress = await getUserProgress();
  if (!userProgress || !userProgress.activeCourse) {
    return null;
  }

  let currentStreak = userProgress.istikrar;
  try {
    currentStreak = await getStreakCount(user.id);
  } catch {
    // fallback to DB value
  }

  return (
    <nav className="lg:hidden h-[50px] flex items-center bg-white border-b fixed top-0 w-full z-50">
      <UserProgress
        activeCourse={userProgress.activeCourse}
        hearts={userProgress.hearts}
        points={userProgress.points}
        istikrar={currentStreak}
        hasInfiniteHearts={userProgress.hasInfiniteHearts || false}
      />
    </nav>
  );
};
