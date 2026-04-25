"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SCORING_SYSTEM } from "@/constants";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  const videoId = searchParams?.get("videoId");
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
      <div className="app-main-content-minh w-full flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground text-center max-w-md">
          {selectedDifficulty} zorluk seviyesi ile oyun yükleniyor...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 py-8 px-4">
      <Link
        href="/games/SubScribe"
        className="self-start flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Geri
      </Link>
      <h1 className="text-2xl font-bold text-neutral-800">Zorluk Seç</h1>

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

      <div className="flex flex-col gap-3">
        {difficulties.map((d) => {
          const mult = SCORING_SYSTEM.GAMES.SUBSCRIBE.DIFFICULTY_MULTIPLIER[d.label] ?? 1;
          return (
            <button
              key={d.value}
              onClick={() => handleSelect(d.value, d.label)}
              className="w-full p-4 rounded-xl border-2 text-left transition-all border-neutral-200 hover:border-indigo-400 hover:bg-indigo-50/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-neutral-800 block">{d.label}</span>
                  <span className="text-sm text-neutral-500">{d.description}</span>
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1">
                  x{mult} puan
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
