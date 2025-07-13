"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SCORING_SYSTEM } from "@/constants";

const difficulties = [
  { 
    label: "Kolay", 
    value: 0.25,
    description: "Az kelime eksik, rahat oynanır"
  },
  { 
    label: "Orta", 
    value: 0.5,
    description: "Orta seviye zorluk, daha fazla kelime eksik"
  },
  { 
    label: "Zor", 
    value: 0.75,
    description: "Çok kelime eksik, büyük meydan okuma"
  },
  { 
    label: "Aşırı Zor", 
    value: 1.0,
    description: "En zor seviye, maksimum meydan okuma"
  },
];

export default function SelectDifficultyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams.get("videoId");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");

  if (!videoId) {
    router.push("/");
    return null;
  }

  const handleSelect = (ratio: number, label: string) => {
    setIsLoading(true);
    setSelectedDifficulty(label);
    // Pass difficulty label in URL for the game component
    router.push(`/games/SubScribe/game?videoId=${videoId}&ratio=${ratio}&difficulty=${encodeURIComponent(label)}`);
  };

  // Show loading spinner when navigating to game
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground text-center max-w-md">
          {selectedDifficulty} zorluk seviyesi ile oyun yükleniyor...
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "auto" }}>
      <h1 className="text-3xl font-bold mb-6">Zorluk Seç</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Nasıl Çalışır?</h2>
        <div className="max-h-64 overflow-y-auto grid grid-cols-1 gap-2 scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200 pr-2">
          <p>
            Bu oyunda YouTube videosunun transkripti ile karşılaşacaksınız. 
            Bazı kelimeler eksik olacak ve sizin göreviniz doğru kelimeleri yazmak.
          </p>
          <p>
            Seçtiğiniz zorluk seviyesi kaç kelimenin eksik olacağını belirler.
            Zorluk ne kadar yüksekse, o kadar çok kelime tahmin etmeniz gerekir.
          </p>
          <p>
            <strong>Puanlama Sistemi:</strong>
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Doğru kelime: +{SCORING_SYSTEM.GAMES.SUBSCRIBE.CORRECT_WORD} puan (her zorlukta aynı)</li>
            <li>• Yanlış deneme: {SCORING_SYSTEM.GAMES.SUBSCRIBE.INCORRECT_PENALTY} puan</li>
            <li>• Tamamlama bonusu: +{SCORING_SYSTEM.GAMES.SUBSCRIBE.COMPLETION_BONUS} puan</li>
            <li>• Hatasız bonus: +{SCORING_SYSTEM.GAMES.SUBSCRIBE.PERFECT_BONUS} puan</li>
          </ul>
          <p className="text-sm text-gray-600">
            Oyunu bitirmek için &quot;Bitir&quot; butonuna tıklayın. İyi şanslar!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {difficulties.map((d) => (
          <button
            key={d.value}
            onClick={() => handleSelect(d.value, d.label)}
            className="border-2 rounded-xl p-4 shadow-lg bg-white text-left hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
            disabled={isLoading}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-lg font-medium block">{d.label}</span>
                <span className="text-sm text-gray-600 block">{d.description}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-green-600">1 puan</span>
                <div className="text-xs text-gray-500">kelime başına</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
