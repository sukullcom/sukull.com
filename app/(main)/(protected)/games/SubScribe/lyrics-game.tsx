import { useEffect, useState } from "react";
import { addPointsToUser } from "@/actions/challenge-progress";
import LyricLine from "./lyrics-line";

interface LyricWord {
  word: string;
  missing: boolean;
}

interface LyricLineType {
  startTime: number;
  words: LyricWord[];
}

interface LyricsGameProps {
  lyrics: LyricLineType[];
  onTryAgain: () => void;
}

export default function LyricsGame({ lyrics, onTryAgain }: LyricsGameProps) {
  const [points, setPoints] = useState(0);
  const [remainingMissingWords, setRemainingMissingWords] = useState(0);
  const [finishButtonClicked, setFinishButtonClicked] = useState(false);

  useEffect(() => {
    // Reset points and counts when lyrics change (like on try again)
    let total = 0;
    for (const line of lyrics) {
      for (const w of line.words) {
        if (w.missing) total++;
      }
    }
    setPoints(0);
    setFinishButtonClicked(false);
    setRemainingMissingWords(total);
  }, [lyrics]);

  const handleWordCompletion = (isCorrect: boolean) => {
    if (isCorrect) {
      setPoints((prev) => prev + 2);
      setRemainingMissingWords((prev) => prev - 1);
    } else {
      setPoints((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    addPointsToUser(points);
    setFinishButtonClicked(true);
    alert("Your points have been submitted!");
  };

  const handleTryAgainClick = () => {
    onTryAgain();
  };

  // Button display logic:
  // 1. If words remain, show remaining count.
  // 2. If no words remain and not finished, show Finish button.
  // 3. If no words remain and finished, show Try Again.

  let actionElement;
  if (remainingMissingWords > 0) {
    actionElement = (
      <span className="text-md text-gray-700">
        Kalan kelime sayısı: {remainingMissingWords}
      </span>
    );
  } else if (!finishButtonClicked) {
    actionElement = (
      <button
        onClick={handleFinish}
        className="py-2 px-4 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
      >
        Finish
      </button>
    );
  } else {
    // No words remain and finish was clicked
    actionElement = (
      <button
        onClick={handleTryAgainClick}
        className="py-2 px-4 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
      >
        Try Again
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/points.svg" alt="Points Icon" className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Puan: {points}</h2>
        </div>
        <div className="text-right flex items-center gap-4">{actionElement}</div>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-lg scrollbar-thin scrollbar-thumb-lime-500 scrollbar-track-gray-200 pr-2">
        {lyrics.map((line, index) => (
          <LyricLine
            key={index}
            line={line}
            onWordComplete={handleWordCompletion}
          />
        ))}
      </div>
    </div>
  );
}
