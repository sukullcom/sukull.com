import { getUserProgress } from "@/db/queries";
import { redirect } from "next/navigation";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { FeedWrapper } from "@/components/feed-wrapper";
import SnakeGame from "./snake-game";

const SnakeGamePage = async () => {
  const userProgress = await getUserProgress();

  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses");
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={userProgress.activeCourse}
          hearts={userProgress.hearts}
          points={userProgress.points}
          istikrar={userProgress.istikrar}
          hasActiveSubscription={false}
        />
      </StickyWrapper>
      <FeedWrapper>
        <SnakeGame />
      </FeedWrapper>
    </div>
  );
};

export default SnakeGamePage;
