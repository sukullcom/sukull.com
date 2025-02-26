import { FeedWrapper } from "@/components/feed-wrapper";
import { Quests } from "@/components/quests";
import { getUserProgress } from "@/db/queries";
import Image from "next/image";
import { redirect } from "next/navigation";

const QuestsPage = async () => {
  const userProgressData = getUserProgress();
  const [userProgress] = await Promise.all([userProgressData]);

  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses");
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">

      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
          <Image src="/mascot_orange.svg" alt="Quests" height={90} width={90} />
          <div className="my-10">
            <Quests points={userProgress.points} />
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default QuestsPage;
