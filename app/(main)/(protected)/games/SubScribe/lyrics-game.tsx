import { useEffect, useState } from "react";
import { addPointsToUser } from "@/actions/challenge-progress";
import { SCORING_SYSTEM } from "@/constants";
import { useCompletionModal } from "@/store/use-completion-modal";
import LyricLine from "./lyrics-line";
import Image from "next/image";
import { Sparkles, CircleCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientLogger } from "@/lib/client-logger";

interface LyricWord {
  word: string;
  missing: boolean;
}

type DifficultyLevel = "Kolay" | "Orta" | "Zor" | "Aşırı Zor";

interface LyricsGameProps {
  lyrics: Array<{
    startTime: number;
    words: LyricWord[];
  }>;
  difficulty?: DifficultyLevel;
}

export default function LyricsGame({ lyrics, difficulty = "Kolay" }: LyricsGameProps) {
  const [points, setPoints] = useState(0);
  const [remainingMissingWords, setRemainingMissingWords] = useState(0);
  const [finishButtonClicked, setFinishButtonClicked] = useState(false);
  const [isProcessingFinish, setIsProcessingFinish] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [totalWordsAttempted, setTotalWordsAttempted] = useState(0);
  const { open: openCompletionModal } = useCompletionModal();

  useEffect(() => {
    // Calculate total missing words when lyrics first load
    let total = 0;
    for (const line of lyrics) {
      for (const w of line.words) {
        if (w.missing) total++;
      }
    }
    setPoints(0);
    setFinishButtonClicked(false);
    setRemainingMissingWords(total);
    setIsProcessingFinish(false);
    setMistakeCount(0);
    setTotalWordsAttempted(0);
  }, [lyrics]);

  const handleWordCompletion = (isCorrect: boolean) => {
    setTotalWordsAttempted(prev => prev + 1);
    
    if (isCorrect) {
      // Calculate points with difficulty multiplier
      const basePoints = SCORING_SYSTEM.GAMES.SUBSCRIBE.CORRECT_WORD;
      const multiplier = SCORING_SYSTEM.GAMES.SUBSCRIBE.DIFFICULTY_MULTIPLIER[difficulty];
      const wordPoints = Math.round(basePoints * multiplier);
      
      setPoints((prev) => prev + wordPoints);
      setRemainingMissingWords((prev) => prev - 1);
    } else {
      const penalty = SCORING_SYSTEM.GAMES.SUBSCRIBE.INCORRECT_PENALTY;
      setPoints((prev) => Math.max(0, prev + penalty)); // Don't go below 0
      setMistakeCount(prev => prev + 1);
    }
  };

  const calculateFinalScore = () => {
    let finalPoints = points;
    
    // Completion bonus if all words are filled
    if (remainingMissingWords === 0) {
      const completionBonus = SCORING_SYSTEM.GAMES.SUBSCRIBE.COMPLETION_BONUS;
      const multiplier = SCORING_SYSTEM.GAMES.SUBSCRIBE.DIFFICULTY_MULTIPLIER[difficulty];
      finalPoints += Math.round(completionBonus * multiplier);
    }
    
    // Perfect bonus if no mistakes
    if (mistakeCount === 0 && remainingMissingWords === 0) {
      const perfectBonus = SCORING_SYSTEM.GAMES.SUBSCRIBE.PERFECT_BONUS;
      const multiplier = SCORING_SYSTEM.GAMES.SUBSCRIBE.DIFFICULTY_MULTIPLIER[difficulty];
      finalPoints += Math.round(perfectBonus * multiplier);
    }
    
    return Math.max(0, finalPoints);
  };

  const handleFinish = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent multiple submissions
    if (isProcessingFinish || finishButtonClicked) {
      return;
    }
    
    setIsProcessingFinish(true);
    setFinishButtonClicked(true);
    
    try {
      const finalScore = calculateFinalScore();
      await addPointsToUser(finalScore, { gameType: "subscribe" });
      openCompletionModal(finalScore);
    } catch (error) {
      clientLogger.error({ message: "add points failed (SubScribe)", error, location: "games/SubScribe/lyrics-game" });
      // Show modal even if points submission fails
      const finalScore = calculateFinalScore();
      openCompletionModal(finalScore);
    } finally {
      setIsProcessingFinish(false);
    }
  };

  // Calculate preview of final score for display
  const previewFinalScore = calculateFinalScore();

  // Button display logic:
  let actionElement;
  if (remainingMissingWords > 0) {
    actionElement = (
      <div className="text-right">
        <span className="text-md text-gray-700 block">
          Kalan kelime: {remainingMissingWords}
        </span>
        <span className="text-sm text-blue-600">
          Tahmini puan: {previewFinalScore}
        </span>
      </div>
    );
  } else if (!finishButtonClicked) {
    actionElement = (
      <div className="text-right">
        <div className="mb-2">
          <span className="text-sm text-green-600 block">
            <Sparkles className="w-4 h-4 inline" /> Tüm kelimeler tamamlandı!
          </span>
          <span className="text-sm text-blue-600">
            Final puan: {previewFinalScore}
          </span>
        </div>
        <Button
          onClick={handleFinish}
          variant="super"
          type="button"
          disabled={isProcessingFinish}
          className="px-6"
        >
          {isProcessingFinish ? "İşleniyor..." : "Bitir"}
        </Button>
      </div>
    );
  } else {
    actionElement = (
      <div className="flex items-center gap-2 text-green-600 font-semibold">
        <span><CircleCheck className="w-4 h-4 text-green-500" /></span>
        <div className="text-right">
          <span className="text-md block">Tamamlandı!</span>
          <span className="text-sm">Final: {previewFinalScore} puan</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 bg-white rounded-xl p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Image src="/points.svg" alt="Points Icon" width={24} height={24} className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Puan: {points}</h2>
          </div>
          <div className="text-right flex items-center gap-4">{actionElement}</div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600 bg-gray-50 rounded p-2">
          <div className="flex gap-4">
            <span>Zorluk: {difficulty} (x{SCORING_SYSTEM.GAMES.SUBSCRIBE.DIFFICULTY_MULTIPLIER[difficulty]} puan)</span>
            <span>Hata: {mistakeCount}</span>
            <span>Deneme: {totalWordsAttempted}</span>
          </div>
          <div className="text-right">
            {mistakeCount === 0 && remainingMissingWords === 0 && (
              <span className="text-green-600 font-semibold"><Trophy className="w-5 h-5 inline text-amber-500" /> Mükemmel!</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-xl scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200 pr-2">
        {lyrics.map((line, index) => (
          <LyricLine
            key={`line-${index}-${line.startTime}`}
            line={line}
            onWordComplete={handleWordCompletion}
          />
        ))}
      </div>
    </div>
  );
}
