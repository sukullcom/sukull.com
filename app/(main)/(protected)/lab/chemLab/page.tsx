import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import Card from "@/components/ui/card";
import { UserProgress } from "@/components/user-progress";
import { getUserProgress } from "@/db/queries";
import { redirect } from "next/navigation";

const chemLabData = [
  {
    id: "periodic-table",
    name: "Periyodik Tablo",
    imageSrc: "/games.svg",
  },
  {
    id: "experiments",
    name: "Deneyler",
    imageSrc: "/games.svg",
  },
  {
    id: "atoms",
    name: "Atomlar",
    imageSrc: "/games.svg",
  },
];

const ChemLabPage = async () => {
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
            Kimya Laboratuvarı
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-6">
            Deneyler, atomlar ve periyodik tablo ile kimyayı keşfedin
          </p>
          <div className="p-8">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-6 auto-rows-fr">
              {chemLabData.map((item) => (
                <Card
                  key={item.id}
                  imageSrc={item.imageSrc}
                  title={item.name}
                  href={`/lab/chemLab/${item.id}`}
                  buttonText="Keşfet"
                />
              ))}
            </div>
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default ChemLabPage;
