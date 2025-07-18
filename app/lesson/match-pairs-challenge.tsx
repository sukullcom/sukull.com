"use client";

import { challengeOptions, challenges } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Image from "next/image";

type Props = {
  options: (typeof challengeOptions.$inferSelect)[];
  onSelect: (id: number) => void;
  status: "correct" | "wrong" | "none";
  selectedOption?: number;
  disabled?: boolean;
  type: (typeof challenges.$inferSelect)["type"];
  questionImageSrc?: string | null | undefined; // Add question image support
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

export const MatchPairsChallenge = ({
  options,
  onSelect,
  status,
  selectedOption,
  disabled,
  questionImageSrc, // Add questionImageSrc prop
}: Props) => {
  const [cards, setCards] = useState<PairCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Initialize cards from options
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
          isFlipped: true, // Show all cards face-up initially
          isMatched: false,
        });
      }
    });

    // Shuffle the cards for random positioning
    const shuffled = [...pairCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, [options]);

  // Reset component state when status changes to "none" (for practice mode and next challenge)
  useEffect(() => {
    if (status === "none" && selectedOption === undefined) {
      // Reset all internal state
      setSelectedCards([]);
      setMatchedPairs([]);
      setIsChecking(false);
      
      // Reset all cards to face-up and unmatched state
      setCards(prev => prev.map(card => ({
        ...card,
        isFlipped: true, // Keep all cards face-up
        isMatched: false
      })));
    }
  }, [status, selectedOption]);

  const handleCardClick = (cardId: number) => {
    if (disabled || isChecking) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isMatched || selectedCards.includes(cardId)) return;

    const newSelectedCards = [...selectedCards, cardId];
    setSelectedCards(newSelectedCards);

    // Check for matches when 2 cards are selected
    if (newSelectedCards.length === 2) {
      setIsChecking(true);
      
      const [firstCardId, secondCardId] = newSelectedCards;
      const firstCard = cards.find(c => c.id === firstCardId);
      const secondCard = cards.find(c => c.id === secondCardId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Correct match!
        const newMatchedPairs = [...matchedPairs, firstCard.pairId];
        setMatchedPairs(newMatchedPairs);
        
        setCards(prev => prev.map(c => 
          (c.id === firstCardId || c.id === secondCardId) 
            ? { ...c, isMatched: true }
            : c
        ));

        // Check if all pairs are matched
        const totalPairs = new Set(cards.map(c => c.pairId)).size;
        if (newMatchedPairs.length === totalPairs) {
          // All pairs matched - award points
          const correctOption = options.find(opt => opt.correct);
          if (correctOption) {
            setTimeout(() => onSelect(correctOption.id), 500);
          }
        }
        
        setSelectedCards([]);
        setIsChecking(false);
      } else {
        // Wrong match - deduct hearts immediately
        const wrongOption = options.find(opt => !opt.correct);
        if (wrongOption) {
          onSelect(wrongOption.id);
        }
        
        // Reset selection after brief delay
        setTimeout(() => {
          setSelectedCards([]);
          setIsChecking(false);
        }, 1000);
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
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Find the matching pairs
        </h3>
        <p className="text-sm text-gray-600">
          Click on two cards to match them. Wrong matches will cost hearts!
        </p>
      </div>

      <div className={cn("grid gap-3 max-w-2xl mx-auto", getGridCols())}>
        {cards.map((card) => {
          const isSelected = selectedCards.includes(card.id);
          const isMatched = card.isMatched;

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={cn(
                "aspect-square cursor-pointer transition-all duration-300",
                "rounded-lg border-2 p-2",
                "flex flex-col items-center justify-center",
                "bg-white shadow-md hover:shadow-lg",
                !disabled && !isMatched && "hover:scale-105",
                isSelected && "border-blue-400 bg-blue-50 scale-105",
                isMatched && "border-green-400 bg-green-50",
                !isSelected && !isMatched && "border-gray-300",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {card.imageSrc && (
                <div className="relative w-full h-24 mb-2">
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
                <div className="text-xs text-center font-medium text-gray-800">
                  {card.text}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="text-center">
        <div className="text-sm text-gray-600">
          Matched: {matchedPairs.length} / {new Set(cards.map(c => c.pairId)).size} pairs
        </div>
      </div>
    </div>
  );
}; 