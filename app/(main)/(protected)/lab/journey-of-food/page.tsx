"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Confetti from "react-confetti";
import { Button } from "@/components/ui/button";
import { addPointsToUser } from "@/actions/challenge-progress";
import { useRouter } from "next/navigation";
import { SCORING_SYSTEM } from "@/constants";

// Safe alternative to useAudio from react-use
const useAudio = (config: { src: string; autoPlay: boolean }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    audioRef.current = new Audio(config.src);
    audioRef.current.autoplay = config.autoPlay;
    
    if (config.autoPlay) {
      audioRef.current.play().catch(console.error);
    }
  }, [config.src, config.autoPlay]);
  
  return [null, null, null, audioRef] as const;
};

const steps = [
  {
    title: "Ağız",
    description: `Ekmek çiğnenir ve tükürük salgısı ile karışır. Amilaz enzimi, ekmekteki karbonhidratları parçalamaya başlar.`,
    animationPath: "/assets/mouth-animation.gif",
  },
  {
    title: "Yemek Borusu",
    description: `Çiğnenmiş ekmek peristaltik hareketlerle mideye taşınır.`,
    animationPath: "/assets/esophagus-animation.gif",
  },
  {
    title: "Mide",
    description: `Ekmek mide asidi ve enzimlerle karıştırılır. Proteinler, daha küçük peptitlere ayrılır.`,
    animationPath: "/assets/stomach-animation.gif",
  },
  {
    title: "İnce Bağırsak",
    description: `Ekmek burada enzimler ve safra ile parçalanır. Glikoz gibi besinler kana emilir.`,
    animationPath: "/assets/small-intense-animation.gif",
  },
  {
    title: "Kan Dolaşımı",
    description: `Besinler kan dolaşımı yoluyla vücudun ihtiyaç duyduğu yerlere taşınır.`,
    animationPath: "/assets/circulatory-animation.gif",
  },
  {
    title: "Böbrekler",
    description: `Kan, böbreklerde filtrelenir. Fazla su ve atıklar idrar olarak çıkarılır.`,
    animationPath: "/assets/kidney-animation.gif",
  },
  {
    title: "Kalın Bağırsak",
    description: `Suyu emerek katı atık oluşturur.`,
    animationPath: "/assets/large-intense-animation.gif",
  },
];

const FoodSimulationPage = () => {
  const router = useRouter(); // Initialize router

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);
  const [matchedCards, setMatchedCards] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [waitingForDescription, setWaitingForDescription] = useState(true);

  const [finishAudio] = useAudio({ src: "/finish.mp3", autoPlay: true });

  const [correctAudio, , , correctAudioRef] = useAudio({
    src: "/correct.wav",
    autoPlay: false,
  });

  const [incorrectAudio, , , incorrectAudioRef] = useAudio({
    src: "/wrong.wav",
    autoPlay: false,
  });

  const handleCardClick = async (cardId: string) => {
    if (gameFinished) return;

    if (selectedCard === null) {
      setSelectedCard(cardId);
      setWaitingForDescription(!waitingForDescription);
    } else {
      const firstCard = steps.find(
        (step) =>
          step.animationPath === selectedCard || step.title === selectedCard
      );
      const secondCard = steps.find(
        (step) => step.animationPath === cardId || step.title === cardId
      );

      if (firstCard && secondCard && firstCard.title === secondCard.title) {
        // Correct match
        const matchPoints = SCORING_SYSTEM.GAMES.LAB.JOURNEY_OF_FOOD.CORRECT_MATCH;
        setMatchedCards((prev) => [...prev, firstCard.title]);
        setTotalPoints((prev) => prev + matchPoints);
        await addPointsToUser(matchPoints);
        correctAudioRef.current?.play();
        setHighlightedCard(null);
        
        // Check if game completed
        if (matchedCards.length + 1 === steps.length) {
          // All matches completed - add completion bonus
          const completionBonus = SCORING_SYSTEM.GAMES.LAB.JOURNEY_OF_FOOD.COMPLETION_BONUS;
          setTotalPoints((prev) => prev + completionBonus);
          await addPointsToUser(completionBonus);
          setGameFinished(true);
        }
      } else {
        // Incorrect match
        const penalty = SCORING_SYSTEM.GAMES.LAB.JOURNEY_OF_FOOD.INCORRECT_PENALTY;
        setHighlightedCard(cardId);
        setTotalPoints((prev) => Math.max(0, prev + penalty)); // Don't go below 0
        await addPointsToUser(penalty);
        incorrectAudioRef.current?.play();
        setTimeout(() => {
          setHighlightedCard(null);
        }, 1000);
      }

      setSelectedCard(null);
      setWaitingForDescription(true);
    }
  };

  const restartGame = () => {
    setSelectedCard(null);
    setHighlightedCard(null);
    setMatchedCards([]);
    setTotalPoints(0);
    setGameFinished(false);
    setWaitingForDescription(true);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-8 bg-gray">
      {gameFinished && <Confetti recycle={false} numberOfPieces={500} />}
      {correctAudio}
      {incorrectAudio}
      <div className="flex justify-between w-full max-w-4xl">
        {/* Turn Back Button */}
        <Button variant="default" onClick={() => router.push("/lab")}>
          Gerİ Dön
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-8 text-neutral-700">
        Yiyeceklerin Yolculuğu
      </h1>

      {/* Timeline Card */}
      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-center text-neutral-700">
          Zaman Çizelgesi
        </h2>
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-rose-500 transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>

        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 mt-6">
          <div className="lg:w-1/2">
            {steps[currentStep].animationPath ? (
              <Image
                unoptimized
                src={steps[currentStep].animationPath}
                alt="Animation"
                layout="intrinsic"
                width={600}
                height={400}
                className="rounded-3xl border-2 border-gray-300 shadow-md mx-auto"
              />
            ) : (
              <div className="w-[600px] h-[400px] bg-gray-100 flex items-center justify-center rounded-md ">
                <p className="text-gray-500">Görsel Yok</p>
              </div>
            )}
          </div>
          <div className="lg:w-1/2">
            <div className="bg-gray-100 text-neutral-700 border-gray-300 border-2 transition-none p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">
                {steps[currentStep].title}
              </h2>
              <p>{steps[currentStep].description}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <Button
            variant="danger"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Öncekİ
          </Button>
          <Button
            variant="danger"
            onClick={nextStep}
            disabled={currentStep === steps.length - 1}
          >
            Sonrakİ
          </Button>
        </div>
      </div>

      {/* Matching Game Card */}
      <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-4xl relative">
        <div className="absolute top-4 right-8 flex items-center space-x-2">
          <Image src="/points.svg" alt="Points Icon" width={32} height={32} className="w-8 h-8" />
          <span className="text-lg font-bold text-neutral-700">
            {totalPoints}
          </span>
        </div>
        {gameFinished ? (
          <>
            {finishAudio}
            <div className="text-center p-6 space-y-4 mt-4">
              <h2 className="text-2xl font-semibold">Oyun Bitti</h2>
              <div className="flex items-center gap-x-4 w-full justify-center">
                <div className="bg-white shadow-md rounded-lg p-4">
                  <p className="text-gray-700 text-sm">Toplam Puan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalPoints}
                  </p>
                </div>
              </div>
              <Button variant="danger" onClick={restartGame}>
                Tekrar Oyna
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-center text-neutral-700">
              Eşleştirme Oyunu
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {steps.map((step) => (
                <div
                  key={step.animationPath}
                  className={`p-4 border-2 rounded-lg shadow-md w-48 text-center transition-colors ${
                    matchedCards.includes(step.title)
                      ? "bg-rose-300 border-rose-500"
                      : highlightedCard === step.animationPath
                      ? "bg-rose-300 border-rose-500"
                      : "bg-white border-gray-300 hover:border-rose-500 hover:bg-rose-100"
                  }`}
                  onClick={() => handleCardClick(step.animationPath)}
                >
                  <Image
                    unoptimized
                    src={step.animationPath}
                    alt={step.title}
                    width={100}
                    height={100}
                    className="rounded-md mx-auto"
                  />
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {steps.map((step) => (
                <div
                  key={step.title}
                  className={`p-4 text-neutral-700 border-2 rounded-lg shadow-md w-48 text-center transition-colors ${
                    matchedCards.includes(step.title)
                      ? "bg-rose-300 border-rose-500"
                      : highlightedCard === step.title
                      ? "bg-rose-300 border-rose-500"
                      : "bg-gray-100 border-gray-300 hover:border-rose-500 hover:bg-rose-100"
                  }`}
                  onClick={() => handleCardClick(step.title)}
                >
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="h-16" />
    </div>
  );
};

export default FoodSimulationPage;
