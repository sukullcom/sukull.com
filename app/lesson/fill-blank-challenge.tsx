"use client";

import { challengeOptions, challenges } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { MathRenderer } from "@/components/ui/math-renderer";

type Props = {
  options: (typeof challengeOptions.$inferSelect)[];
  onSelect: (id: number) => void;
  status: "correct" | "wrong" | "none";
  selectedOption?: number;
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
  question: string;
  questionImageSrc?: string | null | undefined;
};

type QuestionPart = {
  id: number;
  text: string;
  isBlank: boolean;
};

function countDollarSigns(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "$" && (i === 0 || text[i - 1] !== "\\")) {
      count++;
    }
  }
  return count;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const FillBlankChallenge = ({
  options,
  onSelect,
  status,
  selectedOption,
  disabled,
  question,
  questionImageSrc,
}: Props) => {
  const [questionParts, setQuestionParts] = useState<QuestionPart[]>([]);

  const shuffledOptions = useMemo(
    () => shuffleArray(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.map((o) => o.id).join(",")]
  );

  useEffect(() => {
    const parts: QuestionPart[] = [];
    let id = 0;

    const blankCount = options.filter((opt) => opt.isBlank).length;
    const numberedPatterns =
      blankCount > 0
        ? Array.from({ length: blankCount }, (_, i) => `\\{${i + 1}\\}`).sort(
            (a, b) => b.length - a.length
          )
        : [];
    const numberedRegex =
      numberedPatterns.length > 0
        ? new RegExp(`(${numberedPatterns.join("|")})`)
        : null;

    const hasNumbered = numberedRegex && numberedRegex.test(question);
    const hasUnderscore = !hasNumbered && question.includes("___");

    let segments: string[];

    if (hasNumbered && numberedRegex) {
      segments = question.split(numberedRegex);
    } else if (hasUnderscore) {
      segments = question.split("___");
    } else {
      segments = [question];
    }

    if (hasNumbered && numberedRegex) {
      segments.forEach((seg) => {
        if (seg.match(/^\{\d+\}$/)) {
          parts.push({ id: id++, text: "", isBlank: true });
        } else if (seg) {
          parts.push({ id: id++, text: seg, isBlank: false });
        }
      });
    } else if (hasUnderscore) {
      segments.forEach((seg, i) => {
        if (seg) {
          parts.push({ id: id++, text: seg, isBlank: false });
        }
        if (i < segments.length - 1) {
          parts.push({ id: id++, text: "", isBlank: true });
        }
      });
    } else {
      if (question) {
        parts.push({ id: id++, text: question, isBlank: false });
      }
    }

    for (let idx = 0; idx < parts.length; idx++) {
      const item = parts[idx];
      if (item.isBlank) continue;
      const dc = countDollarSigns(item.text);
      if (dc % 2 === 0) continue;
      let text = item.text;
      const trailingDollar = text.match(/\$\s*$/);
      if (trailingDollar) {
        text = text.slice(0, -trailingDollar[0].length);
      } else {
        text = text + "$";
      }
      parts[idx] = { ...item, text };
      for (let j = idx + 1; j < parts.length; j++) {
        if (!parts[j].isBlank) {
          const next = parts[j].text;
          const leadingDollar = next.match(/^\s*\$/);
          if (leadingDollar) {
            parts[j] = {
              ...parts[j],
              text: next.slice(leadingDollar[0].length),
            };
          }
          break;
        }
      }
    }

    setQuestionParts(parts);
  }, [question, options]);

  const handleChipClick = (optionId: number) => {
    if (disabled || status !== "none") return;
    onSelect(optionId);
  };

  const getSelectedText = (): string => {
    if (selectedOption === undefined || selectedOption === null) return "";
    const opt = options.find((o) => o.id === selectedOption);
    if (!opt) return "";
    return opt.text.replace(/^\$+/, "").replace(/\$+$/, "").trim();
  };

  const renderPart = (part: QuestionPart) => {
    if (!part.isBlank) {
      return (
        <span key={part.id} className="text-gray-800">
          <MathRenderer>{part.text}</MathRenderer>
        </span>
      );
    }

    const selectedText = getSelectedText();
    const hasSelection =
      selectedOption !== undefined && selectedOption !== null;

    return (
      <span
        key={part.id}
        className={cn(
          "inline-flex items-center justify-center mx-1 px-4 py-2 min-w-[80px] min-h-[40px] border-2 rounded-lg transition-all duration-200",
          !hasSelection && "border-dashed border-gray-300 bg-gray-100 text-gray-400",
          hasSelection && status === "none" && "border-solid border-sky-400 bg-sky-50 text-sky-700 font-semibold",
          status === "correct" && "border-solid border-green-500 bg-green-50 text-green-700 font-semibold",
          status === "wrong" && "border-solid border-rose-500 bg-rose-50 text-rose-700 font-semibold"
        )}
      >
        {hasSelection ? (
          <MathRenderer>{selectedText}</MathRenderer>
        ) : (
          <span className="text-lg">?</span>
        )}
      </span>
    );
  };

  const renderQuestionImage = () => {
    if (!questionImageSrc) return null;
    return (
      <div className="mb-4 flex justify-center">
        <div className="relative max-w-sm w-full aspect-square">
          <Image
            src={questionImageSrc}
            alt="Challenge question image"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain rounded-lg"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderQuestionImage()}

      <div className="text-lg leading-relaxed p-6 bg-gray-50 rounded-lg border">
        <div className="flex flex-wrap items-center gap-1">
          {questionParts.map(renderPart)}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {shuffledOptions.map((option) => {
          const isSelected = selectedOption === option.id;
          const isCorrectAnswer = option.correct;

          return (
            <button
              key={option.id}
              onClick={() => handleChipClick(option.id)}
              disabled={disabled || status !== "none"}
              className={cn(
                "px-5 py-3 rounded-xl border-2 text-base font-medium transition-all duration-200",
                "active:scale-95",
                status === "none" && !isSelected && "border-gray-200 bg-white text-gray-700 hover:border-sky-300 hover:bg-sky-50 cursor-pointer",
                status === "none" && isSelected && "border-sky-500 bg-sky-100 text-sky-700 shadow-sm cursor-pointer",
                status === "correct" && isSelected && "border-green-500 bg-green-100 text-green-700",
                status === "correct" && !isSelected && "border-gray-200 bg-gray-50 text-gray-400",
                status === "wrong" && isSelected && "border-rose-500 bg-rose-100 text-rose-700",
                status === "wrong" && !isSelected && isCorrectAnswer && "border-green-500 bg-green-100 text-green-700 ring-2 ring-green-300",
                status === "wrong" && !isSelected && !isCorrectAnswer && "border-gray-200 bg-gray-50 text-gray-400",
                (disabled || status !== "none") && "cursor-default"
              )}
            >
              <MathRenderer>{option.text}</MathRenderer>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-500 text-center">
        Boşluğu doldurmak için bir seçenek seçin
      </p>
    </div>
  );
};
