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
  const [borderColors, setBorderColors] = useState<string[]>(() =>
    line.words.map(() => "#ccc")
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
    // Reset processed and border
    setIsProcessed((prev) => {
      const arr = [...prev];
      arr[index] = false;
      return arr;
    });
    setBorderColors((prev) => {
      const arr = [...prev];
      arr[index] = "#ccc";
      return arr;
    });
  };

  const checkWord = (index: number) => {
    const correctWord = line.words[index].word.trim().toLowerCase();
    const userWord = userInputs[index].trim().toLowerCase();
    const isComplete = correctWord === userWord;

    if (isComplete) {
      onWordComplete(true);
      setIsProcessed((prev) => {
        const arr = [...prev];
        arr[index] = true;
        return arr;
      });
      setInputDisabled((prev) => {
        const arr = [...prev];
        arr[index] = true;
        return arr;
      });
      setBorderColors((prev) => {
        const arr = [...prev];
        arr[index] = "green";
        return arr;
      });
    } else {
      onWordComplete(false);
      setIsProcessed((prev) => {
        const arr = [...prev];
        arr[index] = true;
        return arr;
      });
      setBorderColors((prev) => {
        const arr = [...prev];
        arr[index] = "red";
        return arr;
      });
      // Reset after 1 second
      setTimeout(() => {
        setUserInputs((prev) => {
          const arr = [...prev];
          arr[index] = "";
          return arr;
        });
        setIsProcessed((prev) => {
          const arr = [...prev];
          arr[index] = false;
          return arr;
        });
        setBorderColors((prev) => {
          const arr = [...prev];
          arr[index] = "#ccc";
          return arr;
        });
      }, 1000);
    }
  };

  return (
    <div className="lyric-line" style={{ marginBottom: "10px" }}>
      {line.words.map((w, i) => {
        const decodedWord = decode(w.word);
        if (w.missing) {
          return (
            <input
              key={i}
              type="text"
              maxLength={decodedWord.length}
              value={userInputs[i]}
              onChange={(e) => handleInputChange(i, e.target.value)}
              style={{
                border: `2px solid ${borderColors[i]}`,
                padding: "5px",
                margin: "0 5px",
                minWidth: `${decodedWord.length * 20}px`,
                fontFamily: "monospace",
                fontSize: "18px",
                outline: "none",
                textAlign: "center",
                backgroundColor: inputDisabled[i] ? "#e0ffe0" : "#fff",
                borderRadius: "4px",
                transition: "border-color 0.3s",
              }}
              disabled={inputDisabled[i]}
            />
          );
        } else {
          return (
            <span key={i} style={{ margin: "0 5px" }}>
              {decodedWord}
            </span>
          );
        }
      })}
    </div>
  );
}
