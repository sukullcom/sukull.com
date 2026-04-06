"use client";

import { challengeOptions, challenges } from "@/db/schema";
import { useEffect, useRef, useState, useTransition, useMemo } from "react";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { Challenge } from "./challenge";
import { Footer } from "./footer";
import { upsertChallengeProgress, reduceHearts, awardLessonCompletionBonus } from "@/actions/challenge-progress";
import { toast } from "sonner";
import Image from "next/image";
import { ResultCard } from "./result-card";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";
import { MathRenderer } from "@/components/ui/math-renderer";
import { SCORING_SYSTEM } from "@/constants";

type Props = {
  initialPercentage: number;
  initialHearts: number;
  initialPoints: number;
  initialLessonId: number;
  initialLessonChallenges: (typeof challenges.$inferSelect & {
    completed: boolean;
    challengeOptions: (typeof challengeOptions.$inferSelect)[];
  })[];
  userSubscription: unknown; // TODO: Replace with subscription DB type
  hasInfiniteHearts?: boolean;
};

// Safe alternatives to react-use hooks
const useAudio = (config: { src: string; autoPlay: boolean }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    audioRef.current = new Audio(config.src);
    audioRef.current.autoplay = config.autoPlay;
  }, [config.src, config.autoPlay]);
  
  const controls = useMemo(() => ({
    play: () => audioRef.current?.play().catch(console.error)
  }), []);
  
  return [null, null, controls] as const;
};

const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return size;
};

const useMount = (callback: () => void) => {
  useEffect(() => {
    callback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

export const Quiz = ({
  initialPercentage,
  initialHearts,
  initialPoints,
  initialLessonId,
  initialLessonChallenges,
  hasInfiniteHearts = false,
}: Props) => {
  // *******************************
  // 1) Audio Elements
  // *******************************
  const [finishAudioEl, , finishControls] = useAudio({
    src: "/finish.mp3",
    autoPlay: false,
  });
  const [correctAudioEl, , correctControls] = useAudio({
    src: "/correct.wav",
    autoPlay: false,
  });
  const [incorrectAudioEl, , incorrectControls] = useAudio({
    src: "/incorrect.wav",
    autoPlay: false,
  });

  // Used to play finish audio only once when lesson is complete
  const finishPlayedRef = useRef(false);

  // *******************************
  // 2) Hooks and States
  // *******************************
  const { open: openHeartsModal } = useHeartsModal();
  const { open: openPracticeModal } = usePracticeModal();

  const { width, height } = useWindowSize();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [lessonId] = useState(initialLessonId);
  const [hearts, setHearts] = useState(initialHearts);
  const [points, setPoints] = useState(initialPoints);
  const [wrongCount, setWrongCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lessonBonuses, setLessonBonuses] = useState<{
    completionBonus: number;
    perfectBonus: number;
  } | null>(null);

  const isPracticeMode = initialPercentage === 100;

  const [percentage, setPercentage] = useState(() =>
    isPracticeMode ? 0 : initialPercentage
  );

  const [challenges] = useState(initialLessonChallenges);

  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = challenges.findIndex((c) => !c.completed);
    return idx === -1 ? 0 : idx;
  });

  const [selectedOption, setSelectedOption] = useState<number>();
  const [status, setStatus] = useState<"correct" | "wrong" | "none">("none");

  useMount(() => {
    if (isPracticeMode) {
      openPracticeModal();
    }
  });

  // *******************************
  // 3) Check if lesson finished
  // *******************************
  const challenge = challenges[activeIndex];
  const lessonFinished = !challenge;

  useEffect(() => {
    if (lessonFinished && !finishPlayedRef.current) {
      finishPlayedRef.current = true;
      finishControls.play();

      if (!isPracticeMode) {
        awardLessonCompletionBonus(lessonId, wrongCount).then((bonuses) => {
          setLessonBonuses(bonuses);
          setPoints((prev) => prev + bonuses.completionBonus + bonuses.perfectBonus);
        });
      }
    }
  }, [lessonFinished, finishControls, lessonId, wrongCount, isPracticeMode]);

  // *******************************
  // 5) Render finished lesson screen
  // *******************************
  if (lessonFinished) {
    return (
      <>
        {/* Audio DOM elements */}
        {finishAudioEl}
        {correctAudioEl}
        {incorrectAudioEl}

        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10000}
        />
        <div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
          <Image
            src="/finish.svg"
            alt="Tamamlandı"
            className="hidden lg:block"
            height={100}
            width={100}
          />
          <Image
            src="/finish.svg"
            alt="Tamamlandı"
            className="block lg:hidden"
            height={50}
            width={50}
          />
          <h1 className="text-xl lg:text-3xl font-bold text-neutral-700">
            Tebrikler! <br />
            Dersi tamamladın.
          </h1>

          {/* Bonus breakdown */}
          {!isPracticeMode && (
            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between items-center px-4 py-2 bg-orange-50 rounded-lg">
                <span className="text-neutral-600">Doğru cevaplar ({correctCount}/{challenges.length})</span>
                <span className="font-bold text-orange-500">
                  +{correctCount * SCORING_SYSTEM.LESSON_CHALLENGE_FIRST}
                </span>
              </div>
              {wrongCount > 0 && (
                <div className="flex justify-between items-center px-4 py-2 bg-red-50 rounded-lg">
                  <span className="text-neutral-600">Yanlış cevaplar ({wrongCount})</span>
                  <span className="font-bold text-red-500">
                    {wrongCount * SCORING_SYSTEM.LESSON_CHALLENGE_PENALTY}
                  </span>
                </div>
              )}
              {lessonBonuses && lessonBonuses.completionBonus > 0 && (
                <div className="flex justify-between items-center px-4 py-2 bg-green-50 rounded-lg">
                  <span className="text-neutral-600">Ders tamamlama bonusu</span>
                  <span className="font-bold text-green-600">
                    +{lessonBonuses.completionBonus}
                  </span>
                </div>
              )}
              {lessonBonuses && lessonBonuses.perfectBonus > 0 && (
                <div className="flex justify-between items-center px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-emerald-700 font-medium">🎯 Hatasız ders bonusu!</span>
                  <span className="font-bold text-emerald-600">
                    +{lessonBonuses.perfectBonus}
                  </span>
                </div>
              )}
            </div>
          )}

          {isPracticeMode && (
            <div className="w-full px-4 py-2 bg-blue-50 rounded-lg text-sm">
              <span className="text-blue-600">Pratik modu — soru başına +{SCORING_SYSTEM.LESSON_CHALLENGE_PRACTICE} puan</span>
            </div>
          )}

          <div className="flex items-center gap-x-4 w-full">
            <ResultCard variant="points" value={points} />
            <ResultCard variant="hearts" value={hearts} hasInfiniteHearts={hasInfiniteHearts} />
          </div>
        </div>
        <Footer
          lessonId={lessonId}
          status="completed"
          onCheck={() => router.push("/learn")}
        />
      </>
    );
  }

  // *******************************
  // 6) Normal case: we have an active challenge
  // *******************************
  const { challengeOptions = [], type, timeLimit } = challenge;
  const title =
    type === "ASSIST"
      ? "Doğru cevapladığına emin misin?"
      : type === "FILL_BLANK"
        ? "Boşlukları doldurun"
        : challenge.question;

  // Handle timer expiration
  const handleTimeUp = () => {
    if (status === "none") {
      startTransition(() => {
        reduceHearts(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            incorrectControls.play();
            setStatus("wrong");
            setWrongCount((c) => c + 1);
            if (!response?.error && !hasInfiniteHearts) {
              setHearts((prev) => Math.max(prev - 1, 0));
              setPoints((prev) => prev - 1);
            }
          })
          .catch(() => toast.error("Bir şeyler yanlış gitti. Lütfen tekrar deneyin."));
      });
    }
  };

  // onNext: move to next challenge
  const onNext = () => {
    setStatus("none");
    setSelectedOption(undefined);
    setActiveIndex((current) => current + 1);
  };

  // onContinue: handle answer checking
  const onContinue = () => {
    if (status === "wrong") {
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }
    
    if (!selectedOption && selectedOption !== -1 && selectedOption !== -2) return;
    if (status === "correct") {
      onNext();
      return;
    }

    let isAnswerCorrect: boolean;

    if (selectedOption === -2) {
      isAnswerCorrect = true;
    } else if (selectedOption === -1) {
      isAnswerCorrect = false;
    } else {
      const correctOption = challengeOptions.find((o) => o.correct);
      if (!correctOption) return;
      isAnswerCorrect = correctOption.id === selectedOption;
    }

    if (isAnswerCorrect) {
      startTransition(() => {
        upsertChallengeProgress(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }
            correctControls.play();
            setStatus("correct");
            setCorrectCount((c) => c + 1);
            setPercentage((prev) => prev + 100 / challenges.length);

            if (isPracticeMode) {
              setPoints((prev) => prev + SCORING_SYSTEM.LESSON_CHALLENGE_PRACTICE);
            } else {
              setPoints((prev) => prev + SCORING_SYSTEM.LESSON_CHALLENGE_FIRST);
            }
          })
          .catch(() => toast.error("Bir şeyler yanlış gitti. Lütfen tekrar deneyin."));
      });
    } else {
      startTransition(() => {
        reduceHearts(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            incorrectControls.play();
            setStatus("wrong");
            setWrongCount((c) => c + 1);
            if (!response?.error && !hasInfiniteHearts) {
              setHearts((prev) => Math.max(prev - 1, 0));
              setPoints((prev) => prev + SCORING_SYSTEM.LESSON_CHALLENGE_PENALTY);
            }
          })
          .catch(() => toast.error("Bir şeyler yanlış gitti. Lütfen tekrar deneyin."));
      });
    }
  };

  const onSkipWrongToNext = () => {
    setStatus("none");
    setSelectedOption(undefined);
    setActiveIndex((current) => current + 1);
  };

  // *******************************
  // 7) Render the ongoing challenge
  // *******************************
  return (
    <>
      {/* Always render audio DOM elements */}
      {finishAudioEl}
      {correctAudioEl}
      {incorrectAudioEl}

      <Header hearts={hearts} percentage={percentage} hasInfiniteHearts={hasInfiniteHearts} />

      <div className="flex-1">
        <div className="h-full flex items-center justify-center">
          <div className="kg:min-h-[350px] lg:w-[600px] w-full px-6 lg:px-0 flex flex-col gap-y-12">
            <h1 className="text-lg lg:text-3xl text-center lg:text-start font-bold text-neutral-700">
              <MathRenderer>{title}</MathRenderer>
            </h1>
            <div>
              {type === "ASSIST" && (
                <QuestionBubble question={challenge.question} />
              )}
              <Challenge
                key={`challenge-${activeIndex}-${challenge.id}`}
                options={challengeOptions}
                onSelect={(id) => {
                  if (status === "none") {
                    setSelectedOption(id);
                  }
                }}
                status={status}
                selectedOption={selectedOption}
                disabled={pending}
                type={type}
                question={challenge.question}
                questionImageSrc={challenge.questionImageSrc}
                timeLimit={timeLimit || undefined}
                onTimeUp={handleTimeUp}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer
        disabled={pending || (selectedOption === undefined && status === "none")}
        status={status}
        onCheck={onContinue}
        onSkipWrong={onSkipWrongToNext}
        lessonId={lessonId}
        explanation={challenge.explanation}
      />
    </>
  );
};
