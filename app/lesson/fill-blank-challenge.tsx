"use client";

import { challengeOptions, challenges } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Image from "next/image"; // Add Image import
import { MathRenderer } from "@/components/ui/math-renderer";

type Props = {
  options: (typeof challengeOptions.$inferSelect)[];
  onSelect: (id: number) => void;
  status: "correct" | "wrong" | "none";
  selectedOption?: number;
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
  question: string;
  questionImageSrc?: string | null | undefined; // Add question image support
};

type BlankItem = {
  id: number;
  text: string;
  isBlank: boolean;
  correctAnswer?: string;
  userAnswer?: string;
  placeholderNumber?: number;
};

function stripLatexWrap(text: string): string {
  return text.replace(/^\$+/, "").replace(/\$+$/, "").trim();
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
  const [blankItems, setBlankItems] = useState<BlankItem[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  // Initialize blank items from question and options
  useEffect(() => {
    const items: BlankItem[] = [];
    
    // Get blank answers in order (options with isBlank: true)
    const blankAnswers = options.filter(opt => opt.isBlank).sort((a, b) => a.id - b.id);
    const numBlanks = blankAnswers.length;

    // Only split on {1}…{numBlanks} so LaTeX braces like \sqrt{81} are NOT treated as blanks.
    // Longer indices first (e.g. {10} before {1}) so "{10}" is not split as "{1}"+"0}".
    const placeholderPatterns =
      numBlanks > 0
        ? Array.from({ length: numBlanks }, (_, i) => `\\{${i + 1}\\}`).sort(
            (a, b) => b.length - a.length
          )
        : [];
    const splitRegex =
      placeholderPatterns.length > 0
        ? new RegExp(`(${placeholderPatterns.join("|")})`)
        : null;

    const parts = splitRegex ? question.split(splitRegex) : [question];
    let itemId = 0;

    parts.forEach((part) => {
      if (splitRegex && part.match(/^\{\d+\}$/)) {
        const placeholderMatch = part.match(/\{(\d+)\}/);
        if (placeholderMatch) {
          const placeholderNumber = parseInt(placeholderMatch[1], 10);
          const blankIndex = placeholderNumber - 1;
          const rawAnswer = blankAnswers[blankIndex]?.text || "";
          const correctAnswer = stripLatexWrap(rawAnswer);

          items.push({
            id: itemId++,
            text: "",
            isBlank: true,
            correctAnswer,
            placeholderNumber: placeholderNumber,
          });
        }
      } else if (part) {
        // This is text content - include even if empty to maintain proper spacing
        items.push({
          id: itemId++,
          text: part,
          isBlank: false,
        });
      }
    });

    setBlankItems(items);
  }, [question, options]);

  // Reset component state when status changes to "none" (for practice mode and next challenge)
  useEffect(() => {
    if (status === "none" && selectedOption === undefined) {
      // Reset all internal state
      setUserAnswers({});
    }
  }, [status, selectedOption]);

  const handleInputChange = (itemId: number, value: string) => {
    if (disabled) return;
    
    setUserAnswers(prev => ({
      ...prev,
      [itemId]: value
    }));

    // Check if all blanks are filled
    const allBlanks = blankItems.filter(item => item.isBlank);
    
    // Update answers state first
    const updatedAnswers = { ...userAnswers, [itemId]: value };
    
    const allFilled = allBlanks.every(blank => {
      const answer = updatedAnswers[blank.id];
      return answer && answer.trim() !== '';
    });

    if (allFilled) {
      const allCorrect = allBlanks.every(blank => {
        const answer = updatedAnswers[blank.id];
        return answer?.toLowerCase().trim() === blank.correctAnswer?.toLowerCase().trim();
      });

      if (allCorrect) {
        const correctOption = options.find(opt => opt.correct);
        onSelect(correctOption?.id ?? -2);
      } else {
        onSelect(-1);
      }
    }
  };

  const renderBlankItem = (item: BlankItem) => {
    if (!item.isBlank) {
      return (
        <span key={item.id} className="text-gray-800">
          <MathRenderer>{item.text}</MathRenderer>
        </span>
      );
    }

    const userAnswer = userAnswers[item.id] || '';
    const isCorrect = status !== "none" && 
      userAnswer.toLowerCase().trim() === item.correctAnswer?.toLowerCase().trim();
    const isWrong = status !== "none" && 
      userAnswer.trim() !== '' && 
      userAnswer.toLowerCase().trim() !== item.correctAnswer?.toLowerCase().trim();

    // Dynamic width based on expected answer length or minimum width
    const expectedLength = item.correctAnswer?.length || 8;
    const inputWidth = Math.max(80, expectedLength * 8 + 20); // 8px per character + 20px padding

    return (
      <input
        key={item.id}
        type="text"
        value={userAnswer}
        onChange={(e) => handleInputChange(item.id, e.target.value)}
        disabled={disabled}
        style={{ width: `${inputWidth}px` }}
        className={cn(
          "inline-block mx-1 px-3 py-2 border-2 bg-white text-center rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500",
          "transition-all duration-200",
          "border-gray-300 text-gray-700",
          isCorrect && "border-green-500 bg-green-50 text-green-700",
          isWrong && "border-rose-500 bg-rose-50 text-rose-700",
          disabled && "cursor-not-allowed bg-gray-100"
        )}
        placeholder="?"
        autoComplete="off"
        spellCheck="false"
      />
    );
  };

  // Function to render question image if it exists
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
      {/* Fill in the blanks */}
      <div className="text-lg leading-relaxed p-6 bg-gray-50 rounded-lg border">
        <div className="flex flex-wrap items-center gap-1">
          {blankItems.map(renderBlankItem)}
        </div>
      </div>

      {/* Instructions */}
      <p className="text-sm text-gray-500 text-center">
        Boşlukları doğru değerlerle doldurun
      </p>
    </div>
  );
}; 