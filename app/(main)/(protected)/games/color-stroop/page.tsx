import { getUserProgress } from "@/db/queries";
import { redirect } from "next/navigation";
import { FeedWrapper } from "@/components/feed-wrapper";
import ColorStroopGame from "./color-stroop-game";

const ColorStroopPage = async () => {
  const userProgress = await getUserProgress();

  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses?message=select-course");
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-3 sm:px-6">
      <FeedWrapper>
        <ColorStroopGame />
      </FeedWrapper>
    </div>
  );
};

export default ColorStroopPage;
