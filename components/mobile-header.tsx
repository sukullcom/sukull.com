// components/mobile-header.tsx
import { getUserProgress } from "@/db/queries";
import { UserProgress } from "./user-progress";


export const MobileHeader = async () => {
  const userProgressData = getUserProgress();

  const [userProgress] = await Promise.all([userProgressData]);

  if (!userProgress || !userProgress.activeCourse) {
    return null;
  }

  return (
    <nav className="lg:hidden h-[55px] flex items-center bg-white border-b fixed top-0 w-full z-50">
      <UserProgress
        activeCourse={userProgress.activeCourse}
        hearts={userProgress.hearts}
        points={userProgress.points}
        istikrar={userProgress.istikrar}
        hasInfiniteHearts={userProgress.hasInfiniteHearts || false}
      />

    </nav>
  );
};
