import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import Card from "@/components/ui/card";
import { UserProgress } from "@/components/user-progress";
import { getUserProgress } from "@/db/queries";
import Image from "next/image";
import { redirect } from "next/navigation";

interface GameData {
  id: string;
  name: string;
  imageSrc: string;
}

const gamesData: GameData[] = [
  {
    id: "snakable",
    name: "Snakable",
    imageSrc: "/snake.svg",
  },
  {
    id: "SubScribe",
    name: "SubScribe",
    imageSrc: "/subscribe.svg",
  },
  {
    id: "piano",
    name: "Piano",
    imageSrc: "/piano.svg",
  },
];

const GamesPage = async () => {
  const userProgress = await getUserProgress();
  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses");
    return null;
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
          <Image src="/mascot_orange.svg" alt="Quests" height={90} width={90} />
          <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
            Oyunlar
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-6">
            Oyunlar ile hem öğrenip hem de puan kazan
          </p>
          <div className="p-8">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-6 auto-rows-fr">
              {gamesData.map((game) => (
                <Card
                  key={game.id}
                  imageSrc={game.imageSrc}
                  title={game.name}
                  href={`/games/${game.id}`}
                  buttonText="Oyna"
                />
              ))}
            </div>
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default GamesPage;
