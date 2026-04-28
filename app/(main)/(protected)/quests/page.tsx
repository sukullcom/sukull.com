import { FeedWrapper } from "@/components/feed-wrapper";
import { Quests } from "@/components/quests";
import { getUserProgress } from "@/db/queries";
import { getUserBadgeSummary } from "@/actions/user-badges";
import Image from "next/image";
import { redirect } from "next/navigation";

const QuestsPage = async () => {
  const userProgressData = getUserProgress();
  const [userProgress, badgeSummary] = await Promise.all([
    userProgressData,
    getUserBadgeSummary(),
  ]);

  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses?message=select-course");
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-3 sm:px-6">

      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
          <Image src="/mascot_orange.svg" alt="Quests" height={120} width={120} />
          <div className="my-10 w-full max-w-lg">
            <Quests 
              currentStreak={userProgress.istikrar}
              achievements={{
                profileEditingUnlocked: userProgress.profileEditingUnlocked || false,
                studyBuddyUnlocked: userProgress.studyBuddyUnlocked || false,
                codeShareUnlocked: userProgress.codeShareUnlocked || false,
              }}
              badgeSummary={badgeSummary}
              hideLocksAndTipsOnLargeScreens
            />
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default QuestsPage;
