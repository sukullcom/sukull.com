import Image from "next/image";
import { FeedWrapper } from "@/components/feed-wrapper";
import CustomCard from "@/components/custom-card";

// Auth + aktif kurs garantisi üst katmanda: app/(main)/(protected)/layout.tsx
// Feature flag guard'ı: app/(main)/(protected)/lab/layout.tsx
// Bu sayfa tamamen statik veri render eder — DB sorgusu yok.

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
  // Soft-sunset: Kod editörü ve snippets kütüphanesi kullanım verisi
  // değerlendirilene kadar "geliştirme aşamasında" olarak işaretlendi.
  {
    id: "sukull-code-editor",
    name: "Sukull Code Editor",
    imageSrc: "/computer.svg",
    category: "Bilgisayar Laboratuvarı",
    development: true,
  },
  {
    id: "sukull-code-editor/snippets",
    name: "Sukull Kod Kütüphanesi",
    imageSrc: "/computer.svg",
    category: "Bilgisayar Laboratuvarı",
    development: true,
  },
  {
    id: "lab/biology-experiments",
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
    id: "lab/chemistry-experiments",
    name: "Kimya Laboratuvarı",
    imageSrc: "/chemistry.svg",
    category: "Kimya Laboratuvarı",
    development: true,
  },
  {
    id: "lab/physics-experiments",
    name: "Fizik Deneyleri",
    imageSrc: "/physics.svg",
    category: "Fizik Laboratuvarı",
    development: true,
  },
  {
    id: "lab/organic-chemistry",
    name: "Organik Kimya",
    imageSrc: "/chemistry.svg",
    category: "Kimya Laboratuvarı",
    development: true,
  },
];

const uniqueCategories = Array.from(new Set(labsData.map((lab) => lab.category)));
const labsByCategory = uniqueCategories.reduce((acc, category) => {
  acc[category] = labsData.filter((lab) => lab.category === category);
  return acc;
}, {} as Record<string, LabData[]>);

export default function LabsPage() {
  return (
    <div className="flex flex-row-reverse gap-[48px] px-3 sm:px-6">
      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
          <Image
            src="/mascot_orange.svg"
            alt="mascot_orange"
            height={120}
            width={120}
            priority={false}
          />
          <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
            Laboratuvarlar
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-6">
            Laboratuvarda deneyerek öğren
          </p>
          <div className="p-8">
            {uniqueCategories.map((category) => (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{category}</h2>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-6 auto-rows-fr">
                  {labsByCategory[category].map((lab) => (
                    <CustomCard
                      key={lab.id}
                      imageSrc={lab.imageSrc}
                      title={lab.name}
                      href={lab.development ? "#" : `/${lab.id}`}
                      buttonText={
                        lab.development ? "Geliştirme\nAşamasında" : "İncele"
                      }
                      variant={lab.development ? "locked" : "super"}
                      disabled={lab.development}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
}
