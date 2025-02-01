import { getUserProgress } from "@/db/queries";
import { UserProgress } from "./user-progress";
import { Button } from "./ui/button";
import Link from "next/link";

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
        hasActiveSubscription={false}
      />
      <Link prefetch={false} href={"/private-lesson"}>
        <Button className="ml-2 mr-2" variant="sidebarOutline">Özel Ders Al / Ver</Button>
      </Link>
    </nav>
  );
};
