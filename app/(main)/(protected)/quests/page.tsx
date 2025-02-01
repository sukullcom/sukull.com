import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Progress } from "@/components/ui/progress";
import { UserProgress } from "@/components/user-progress";
import { getUserProgress } from "@/db/queries";
import Image from "next/image";
import { redirect } from "next/navigation";

const QuestsPage = async () => {
  const userProgressData = getUserProgress();
  const [userProgress] = await Promise.all([userProgressData]);

  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses");
  }

  // Yeni görev hedefleri
  const updatedQuests = [
    { title: "100 Puan Topla", value: 100 },
    { title: "1000 Puan Topla", value: 1000 },
    { title: "5000 Puan Topla", value: 5000 },
    { title: "10.000 Puan Topla", value: 10000 },
    { title: "100.000 Puan Topla", value: 100000 },
    { title: "1.000.000 Puan Topla", value: 1000000 },
  ];

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
          <Image src="/mascot_orange.svg" alt="Quests" height={90} width={90} />
          <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
            Görevler ve İpuçları
          </h1>

          {/* Kod Editörü Bilgilendirme */}
          <div className="w-full mb-8 p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
            <div className="flex items-center gap-4 mb-4">
              <Image src="/code-icon.png" alt="Code" width={40} height={40} />
              <h2 className="text-xl font-bold text-orange-800">
                Kod Paylaşım Özelliği
              </h2>
            </div>
            <p className="text-orange-700 mb-4">
              Kod editöründe paylaşım yapabilmek için en az 5000 puan toplamalısın!
            </p>
            <div className="flex items-center gap-4">
              <Progress 
                value={(userProgress.points / 5000) * 100} 
                className="h-3 bg-orange-100" 
              />
              <span className="text-orange-700 font-medium">
                {Math.round(userProgress.points)}/5000
              </span>
            </div>
          </div>

          {/* Görevler Listesi */}
          <ul className="w-full mb-12">
            {updatedQuests.map((quest) => {
              const progress = (userProgress.points / quest.value) * 100;
              return (
                <div
                  className="flex items-center w-full p-4 gap-x-4 border-t-2"
                  key={quest.title}
                >
                  <Image src="/points.svg" alt="Points" width={60} height={60} />
                  <div className="flex flex-col gap-y-2 w-full">
                    <p className="text-neutral-700 text-xl font-bold">
                      {quest.title}
                    </p>
                    <Progress value={progress} className="h-3" />
                  </div>
                </div>
              );
            })}
          </ul>

          {/* İpuçları Bölümü */}
          <div className="w-full p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center gap-4 mb-6">
              <Image src="/hint-icon.png" alt="Hints" width={40} height={40} />
              <h2 className="text-xl font-bold text-blue-800">Sistem İpuçları</h2>
            </div>
            
            <div className="space-y-4 text-blue-700">
              <div className="flex items-start gap-3">
                <span>🔁</span>
                <p>
                  <strong>Can Dolumu:</strong> 50 puan harcayarak canlarını doldurabilirsin.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span>🎮</span>
                <p>
                  <strong>Puan Kazan:</strong> Puanın kalmadığında laboratuvar 
                  veya oyunlar bölümünden yeni puanlar kazanabilirsin.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span>📚</span>
                <p>
                  <strong>Çalışma Masası: </strong> 
                  Her doğru soru +10 puan, her yanlış soru -10 puan ve -1 can demektir.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span>🔄</span>
                <p>
                  <strong>Pratik Modu:</strong> Çalışma masasında tamamladığın dersleri tekrar ederek 
                  her doğru cevap için +2 puan ve +1 can kazanabilirsin. Pratik yaparken yanlış 
                  cevap verirsen can veya puan kaybetmezsin.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span>❤️</span>
                <p>
                  <strong>Can Sıfırlanırsa:</strong> Canın kalmadığında yeni soru 
                  cevaplayamazsın. Ancak, oyunlar ve laboratuvarlardan can kazanabilirsin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default QuestsPage;