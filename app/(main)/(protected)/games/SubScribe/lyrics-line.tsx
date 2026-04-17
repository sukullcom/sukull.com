"use client";

import { useEffect, useState } from "react";
import { decode } from "html-entities";

interface LyricWord {
  word: string;
  missing: boolean;
}

interface LyricLineProps {
  line: {
    startTime: number;
    words: LyricWord[];
  };
  onWordComplete: (isCorrect: boolean) => void;
}

type BorderState = "idle" | "correct" | "wrong";

export default function LyricLine({ line, onWordComplete }: LyricLineProps) {
  const [userInputs, setUserInputs] = useState<string[]>(() =>
    line.words.map(() => "")
  );
  const [isProcessed, setIsProcessed] = useState<boolean[]>(() =>
    line.words.map(() => false)
  );
  const [inputDisabled, setInputDisabled] = useState<boolean[]>(() =>
    line.words.map(() => false)
  );
  const [borderStates, setBorderStates] = useState<BorderState[]>(() =>
    line.words.map(() => "idle")
  );

  useEffect(() => {
    line.words.forEach((w, i) => {
      if (w.missing && !isProcessed[i]) {
        const correctWord = w.word.trim();
        const userWord = userInputs[i].trim();
        if (userWord.length === correctWord.length) {
          checkWord(i);
        }
      }
    });
  }, [userInputs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (index: number, value: string) => {
    setUserInputs((prev) => {
      const newArr = [...prev];
      newArr[index] = value.replace(/[^a-zA-Z]/g, "");
      return newArr;
    });
    setIsProcessed((prev) => {
      const arr = [...prev];
      arr[index] = false;
      return arr;
    });
    setBorderStates((prev) => {
      const arr = [...prev];
      arr[index] = "idle";
      return arr;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const correctWord = line.words[index].word.trim();
      const userWord = userInputs[index].trim();
      if (userWord.length === correctWord.replace(/[^a-zA-Z]/g, '').length) {
        checkWord(index);
      }
    }
  };

  const checkWord = (index: number) => {
    const correctWord = line.words[index].word.trim().toLowerCase();
    const userWord = userInputs[index].trim().toLowerCase();

    const cleanCorrectWord = correctWord.replace(/[^a-zA-Z]/g, '');
    const cleanUserWord = userWord.replace(/[^a-zA-Z]/g, '');

    const isComplete = cleanCorrectWord === cleanUserWord;

    if (isComplete) {
      onWordComplete(true);
      setIsProcessed((prev) => { const arr = [...prev]; arr[index] = true; return arr; });
      setInputDisabled((prev) => { const arr = [...prev]; arr[index] = true; return arr; });
      setBorderStates((prev) => { const arr = [...prev]; arr[index] = "correct"; return arr; });
    } else {
      onWordComplete(false);
      setIsProcessed((prev) => { const arr = [...prev]; arr[index] = true; return arr; });
      setBorderStates((prev) => { const arr = [...prev]; arr[index] = "wrong"; return arr; });
      setTimeout(() => {
        setUserInputs((prev) => { const arr = [...prev]; arr[index] = ""; return arr; });
        setIsProcessed((prev) => { const arr = [...prev]; arr[index] = false; return arr; });
        setBorderStates((prev) => { const arr = [...prev]; arr[index] = "idle"; return arr; });
      }, 1000);
    }
  };

  const getBorderClass = (state: BorderState) => {
    switch (state) {
      case "correct": return "border-2 border-green-500 bg-green-50";
      case "wrong": return "border-2 border-red-500 bg-white";
      default: return "border-2 border-gray-300 bg-white";
    }
  };

  return (
    <div className="mb-2.5 leading-relaxed">
      {line.words.map((w, i) => {
        const decodedWord = decode(w.word);
        const cleanWord = decodedWord.replace(/[^a-zA-Z]/g, '');

        if (w.missing) {
          return (
            <input
              key={`missing-${i}-${decodedWord}`}
              type="text"
              maxLength={cleanWord.length}
              value={userInputs[i]}
              onChange={(e) => handleInputChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={`inline-block mx-1 px-1.5 py-1 rounded text-center font-mono text-lg outline-none transition-colors ${getBorderClass(borderStates[i])}`}
              style={{ minWidth: `${Math.max(cleanWord.length * 18, 56)}px` }}
              disabled={inputDisabled[i]}
              placeholder={cleanWord.length > 0 ? `${cleanWord.length} harf` : ""}
            />
          );
        } else {
          return (
            <span key={`word-${i}-${decodedWord}`} className="mx-1">
              {decodedWord}
            </span>
          );
        }
      })}
    </div>
  );
}
