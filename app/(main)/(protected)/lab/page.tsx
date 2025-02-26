import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import Card from "@/components/ui/card";
import { UserProgress } from "@/components/user-progress";
import { getUserProgress } from "@/db/queries";
import Image from "next/image";
import { redirect } from "next/navigation";

interface LabData {
  id: string;
  name: string;
  imageSrc: string;
  category: string;
  development?: boolean;
}

const labsData: LabData[] = [
  {
    id: "LeetCode",
    name: "LeetCode",
    imageSrc: "/computer.svg",
    category: "Bilgisayar Laboratuvarı",
    development: true,
  },
  {
    id: "sukull-code-editor",
    name: "Sukull Code Editor",
    imageSrc: "/computer.svg",
    category: "Bilgisayar Laboratuvarı",
  },
  {
    id: "sukull-code-editor/snippets",
    name: "Sukull Kod Kütüphanesi",
    imageSrc: "/computer.svg",
    category: "Bilgisayar Laboratuvarı",
  },
  {
    id: "lab/biology-experiments", // henüz geliştirme aşamasında
    name: "Biyoloji Deneyleri",
    imageSrc: "/biology.svg",
    category: "Biyoloji Laboratuvarı",
    development: true,
  },
  {
    id: "lab/human-body",
    name: "İnsan Vücudu",
    imageSrc: "/biology.svg",
    category: "Biyoloji Laboratuvarı",
  },
  {
    id: "lab/journey-of-food",
    name: "Yiyeceklerin Yolculuğu",
    imageSrc: "/biology.svg",
    category: "Biyoloji Laboratuvarı",
  },
  {
    id: "lab/chemistry-experiments", // henüz geliştirme aşamasında
    name: "Kimya Laboratuvarı",
    imageSrc: "/chemistry.svg",
    category: "Kimya Laboratuvarı",
    development: true,
  },
  {
    id: "lab/physics-experiments", // henüz geliştirme aşamasında
    name: "Fizik Deneyleri",
    imageSrc: "/physics.svg",
    category: "Fizik Laboratuvarı",
    development: true,
  },
  {
    id: "lab/organic-chemistry", // henüz geliştirme aşamasında
    name: "Organik Kimya",
    imageSrc: "/chemistry.svg",
    category: "Kimya Laboratuvarı",
    development: true,
  },
];

const LabsPage = async () => {
  const userProgressData = getUserProgress();
  const [userProgress] = await Promise.all([userProgressData]);

  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses");
    return null;
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
          <Image
            src="/mascot_orange.svg"
            alt="mascot_orange"
            height={90}
            width={90}
          />
          <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
            Laboratuvarlar
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-6">
            Laboratuvarda deneyerek öğren
          </p>
          <div className="p-8">
            {Array.from(new Set(labsData.map((lab) => lab.category))).map(
              (category) => (
                <div key={category} className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">{category}</h2>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-6 auto-rows-fr">
                    {labsData
                      .filter((lab) => lab.category === category)
                      .map((lab) => (
                        <Card
                          key={lab.id}
                          imageSrc={lab.imageSrc}
                          title={lab.name}
                          href={lab.development ? "#" : `/${lab.id}`}
                          buttonText={
                            lab.development ? "Gelİştİrme\nAşamasında" : "İncele"
                          }
                          variant={lab.development ? "locked" : "super"}
                          disabled={lab.development}
                        />
                      ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default LabsPage;
