import Image from "next/image";
import { Progress } from "@/components/ui/progress";

type Props = {
  points: number;
};

export const Quests = ({ points }: Props) => {
  return (
    <div className="w-full p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
      {/* Görevler Bölümü 
      <div className="flex items-center justify-between w-full space-y-2">
        <h3 className="font-bold text-lg">Görevler</h3>
        <Link prefetch={false} href="/quests">
          <Button size="sm" variant="primaryOutline" className="bg-gray">
            Hepsİnİ gör
          </Button>
        </Link>
      </div>
      <ul className="w-full space-y-4">
        {quests.map((quest) => {
          const progress = (points / quest.value) * 100;
          
          return (
            <div
            className="flex items-center w-full pb-4 gap-x-3"
            key={quest.title}
            >
              <Image src="/points.svg" alt="Points" width={40} height={40} />
              <div className="flex flex-col gap-y-2 w-full">
                <p className="text-neutral-700 text-sm font-bold">
                  {quest.title}
                </p>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          );
        })}
      </ul>
      */}
      <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
        Görevler ve İpuçları
      </h1>

      {/* Kod Editörü Bilgilendirme */}
      <div className="w-full mb-8 p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
        <div className="flex items-center gap-4 mb-4">
          <Image src="/code-icon.svg" alt="Code" width={40} height={40} />
          <h2 className="text-xl font-bold text-orange-800">
            Kod Paylaşım Özelliği
          </h2>
        </div>
        <p className="text-orange-700 mb-4">
          Sukull kod editöründe paylaşım yapabilmek için en az 5000 puanın
          olmalı!
        </p>
        <div className="flex items-center gap-4">
          <Progress
            value={(points / 5000) * 100}
            className="h-3 bg-orange-100"
          />
          <span className="text-orange-700 font-medium">
            {Math.round(points)}/5000
          </span>
        </div>
      </div>

      {/* İpuçları Bölümü */}
      <div className="w-full mb-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
        <div className="flex items-center gap-4 mb-6">
          <Image src="/hint-icon.svg" alt="Hints" width={40} height={40} />
          <h2 className="text-xl font-bold text-blue-800">Sistem İpuçları</h2>
        </div>

        <div className="space-y-4 text-blue-700">
          <div className="flex items-start gap-3">
            <span>🔁</span>
            <p>
              <strong>Can Dolumu:</strong> 50 puan harcayarak canlarını
              doldurabilirsin.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span>🎮</span>
            <p>
              <strong>Puan Kazan:</strong> Puanın kalmadığında laboratuvar veya
              oyunlar bölümünden yeni puanlar kazanabilirsin.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span>📚</span>
            <p>
              <strong>Çalışma Masası: </strong>
              Her doğru soru +10 puan, her yanlış soru -10 puan ve -1 can
              demektir.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span>🔄</span>
            <p>
              <strong>Pratik Modu:</strong> Çalışma masasında tamamladığın
              dersleri tekrar ederek her doğru cevap için +2 puan ve +1 can
              kazanabilirsin. Pratik yaparken yanlış cevap verirsen can veya
              puan kaybetmezsin.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span>❤️</span>
            <p>
              <strong>Can Sıfırlanırsa:</strong> Canın kalmadığında yeni soru
              cevaplayamazsın. Ancak, oyunlar ve laboratuvarlardan can
              kazanabilirsin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
