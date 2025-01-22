import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import Card from "@/components/ui/card";
import { UserProgress } from "@/components/user-progress";
import { getUserProgress } from "@/db/queries";
import { redirect } from "next/navigation";

const compLabData = [
  {
    id: "sukull-code-editor",
    name: "Sukull Code Editor",
    imageSrc: "/games.svg",
  },
  {
    id: "LeetCode",
    name: "LeetCode",
    imageSrc: "/games.svg",
  },
];

const CompLabPage = async () => {
  const userProgressData = getUserProgress();
  const [userProgress] = await Promise.all([userProgressData]);

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
          hasActiveSubscription={false}
        />
      </StickyWrapper>
      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
          <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
            Bilgisayar Laboratuvarı
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-6">
            Kod yazarak, proje üreterek ve problemler çözerek bilgisayar bilimlerini keşfedin.
          </p>
          <div className="p-8">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-6 auto-rows-fr">
              {compLabData.map((item) => (
                <Card
                  key={item.id}
                  imageSrc={item.imageSrc}
                  title={item.name}
                  href={`/lab/compLab/${item.id}`}
                  buttonText="Göz At"
                />
              ))}
            </div>
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default CompLabPage;
