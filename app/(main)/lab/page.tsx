import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import Card from "@/components/ui/card"; // <-- import Card
import { UserProgress } from "@/components/user-progress";
import { getUserProgress } from "@/db/queries";
import Image from "next/image";
import { redirect } from "next/navigation";

const labsData = [
  {
    id: "physLab",
    name: "Fizik Laboratuvarı",
    imageSrc: "/games.svg",
  },
  {
    id: "bioLab",
    name: "Biyoloji Laboratuvarı",
    imageSrc: "/games.svg",
  },
  {
    id: "chemLab",
    name: "Kimya Laboratuvarı",
    imageSrc: "/games.svg",
  },
  {
    id: "compLab",
    name: "Bilgisayar Laboratuvarı",
    imageSrc: "/games.svg",
  },
];

const LabsPage = async () => {
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
          <Image src="/mascot_orange.svg" alt="mascot_orange" height={90} width={90} />
          <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
            Laboratuvarlar
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-6">
            Laboratuvarda deneyerek öğren
          </p>
          <div className="p-8">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-6 auto-rows-fr">
              {labsData.map((lab) => (
                <Card
                  key={lab.id}
                  imageSrc={lab.imageSrc}
                  title={lab.name}
                  href={`/lab/${lab.id}`}
                  buttonText="İçeri Gir"
                />
              ))}
            </div>
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default LabsPage;
