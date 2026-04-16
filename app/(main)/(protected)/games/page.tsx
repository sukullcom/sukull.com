import { FeedWrapper } from "@/components/feed-wrapper";
import CustomCard from "@/components/custom-card";
import { getUserProgress } from "@/db/queries";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Zap, Brain, CircleCheck, Target } from "lucide-react";

interface GameData {
  id: string;
  name: string;
  imageSrc?: string;
  icon?: React.ReactNode;
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
    id: "speed-math",
    name: "Hız Matematiği",
    icon: <Zap className="w-14 h-14 text-yellow-500" />,
  },
  {
    id: "memory-match",
    name: "Hafıza Kartları",
    icon: <Brain className="w-14 h-14 text-purple-500" />,
  },
  {
    id: "true-false",
    name: "Doğru mu Yanlış mı?",
    icon: <CircleCheck className="w-14 h-14 text-green-500" />,
  },
  {
    id: "pattern-memory",
    name: "Sıralama Ustası",
    icon: <Target className="w-14 h-14 text-orange-500" />,
  },
];

const GamesPage = async () => {
  const userProgress = await getUserProgress();
  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses?message=select-course");
    return null;
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-3 sm:px-6">
      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
          <Image src="/mascot_blue.svg" alt="Games" height={120} width={120} />
          <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
            Oyunlar
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-6">
            Oyunlar ile hem öğrenip hem de puan kazan
          </p>
          <div className="w-full px-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-fr">
              {gamesData.map((game) => (
                <CustomCard
                  key={game.id}
                  imageSrc={game.imageSrc}
                  icon={game.icon}
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
