"use client";

import { challengeOptions, challenges } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MathRenderer } from "@/components/ui/math-renderer";
import { READY_TO_CHECK } from "./answer-signals";

type Props = {
  options: (typeof challengeOptions.$inferSelect)[];
  onSelect: (id: number) => void;
  onPairMistake?: () => void;
  status: "correct" | "wrong" | "none";
  selectedOption?: number;
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
  questionImageSrc?: string | null | undefined;
};

type PairCard = {
  id: number;
  pairId: number;
  text: string;
  imageSrc?: string | null;
  audioSrc?: string | null;
  isFlipped: boolean;
  isMatched: boolean;
};

const MISMATCH_MS = 800;

export const MatchPairsChallenge = ({
  options,
  onSelect,
  onPairMistake,
  status,
  selectedOption,
  disabled,
  questionImageSrc,
}: Props) => {
  const [cards, setCards] = useState<PairCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [mismatchingIds, setMismatchingIds] = useState<number[] | null>(null);
  const [expectedPairCount, setExpectedPairCount] = useState(0);
  const mismatchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (mismatchTimeout.current) clearTimeout(mismatchTimeout.current);
    };
  }, []);

  useEffect(() => {
    const pairCards: PairCard[] = [];
    options.forEach((option) => {
      if (option.pairId !== null && option.pairId !== undefined) {
        pairCards.push({
          id: option.id,
          pairId: option.pairId,
          text: option.text,
          imageSrc: option.imageSrc,
          audioSrc: option.audioSrc,
          isFlipped: true,
          isMatched: false,
        });
      }
    });
    const shuffled = [...pairCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setExpectedPairCount(new Set(shuffled.map((c) => c.pairId)).size);
  }, [options]);

  useEffect(() => {
    if (status === "none" && selectedOption === undefined) {
      setSelectedCards([]);
      setMatchedPairs([]);
      setIsChecking(false);
      setMismatchingIds(null);
      setCards((prev) =>
        prev.map((card) => ({ ...card, isFlipped: true, isMatched: false })),
      );
    }
  }, [status, selectedOption]);

  const handleCardClick = (cardId: number) => {
    if (disabled || isChecking) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isMatched || selectedCards.includes(cardId)) return;

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsChecking(true);
      const [firstCardId, secondCardId] = newSelected;
      const firstCard = cards.find((c) => c.id === firstCardId);
      const secondCard = cards.find((c) => c.id === secondCardId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === firstCardId || c.id === secondCardId
              ? { ...c, isMatched: true }
              : c,
          ),
        );
        setMatchedPairs((prev) => {
          const next = [...prev, firstCard.pairId];
          if (next.length === expectedPairCount) {
            queueMicrotask(() => onSelect(READY_TO_CHECK));
          }
          return next;
        });
        setSelectedCards([]);
        setIsChecking(false);
      } else {
        if (mismatchTimeout.current) clearTimeout(mismatchTimeout.current);
        setMismatchingIds([firstCardId, secondCardId]);
        onPairMistake?.();
        mismatchTimeout.current = setTimeout(() => {
          setSelectedCards([]);
          setIsChecking(false);
          setMismatchingIds(null);
        }, MISMATCH_MS);
      }
    }
  };

  const getGridCols = () => {
    const cardCount = cards.length;
    if (cardCount <= 4) return "grid-cols-2";
    if (cardCount <= 6) return "grid-cols-3";
    if (cardCount <= 8) return "grid-cols-4";
    return "grid-cols-4";
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
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Eşleşen çiftleri bul</h3>
        <p className="text-sm text-gray-600">
          İki karta tıkla. Yanlış eşleştirme candan düşer. Tüm çiftler
          bulununca alttan Kontrol et.
        </p>
      </div>

      <div className={cn("grid gap-4 max-w-4xl mx-auto", getGridCols())}>
        {cards.map((card) => {
          const isSelected = selectedCards.includes(card.id);
          const isMatched = card.isMatched;
          const isMismatching = mismatchingIds?.includes(card.id) ?? false;

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={cn(
                "aspect-square cursor-pointer transition-all duration-300",
                "rounded-lg border-2 p-4",
                "flex flex-col items-center justify-center",
                "bg-white shadow-md hover:shadow-lg",
                !disabled && !isMatched && "hover:scale-105",
                isSelected && "border-blue-400 bg-blue-50 scale-105",
                isMismatching && "border-rose-500 bg-rose-50",
                isMatched && "border-green-400 bg-green-50",
                !isSelected && !isMatched && "border-gray-300",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {card.imageSrc && (
                <div className="relative w-full h-32 mb-3">
                  <Image
                    src={card.imageSrc}
                    alt={card.text || "Match pair item"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain"
                  />
                </div>
              )}
              {card.text && (
                <div className="text-sm text-center font-medium text-gray-800">
                  <MathRenderer>{card.text}</MathRenderer>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-600">
        Eşleşen: {matchedPairs.length} / {expectedPairCount} çift
      </div>
    </div>
  );
};
