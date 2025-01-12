import { getUserProgress } from "@/db/queries";
import { UserProgress } from "./user-progress";
import { redirect } from "next/navigation";
import { Button } from "./ui/button";
import Link from "next/link";

export const MobileHeader = async () => {
  const userProgressData = getUserProgress();

  const [userProgress] = await Promise.all([userProgressData]);

  if (!userProgress || !userProgress.activeCourse) {
    return null;
  }

  return (
    <nav className="lg:hidden px-6 h-[50px] flex items-center bg-white border-b fixed top-0 w-full z-50">
      <UserProgress
        activeCourse={userProgress.activeCourse}
        hearts={userProgress.hearts}
        points={userProgress.points}
        hasActiveSubscription={false}
      />
      <Link href={"/private-lesson"}>
        <Button variant="sidebarOutline">Özel Ders Al / Ver</Button>
      </Link>
    </nav>
  );
};
