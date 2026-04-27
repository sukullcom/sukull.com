"use client";

import { challengeOptions, challenges, userSubscriptions } from "@/db/schema";
import { useEffect, useRef, useState, useTransition, useMemo } from "react";
import type { SequenceChallengeHandle } from "./sequence-challenge";
import { ANSWER_CORRECT, ANSWER_WRONG, READY_TO_CHECK } from "./answer-signals";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { Challenge } from "./challenge";
import { Footer } from "./footer";
import { upsertChallengeProgress, reduceHearts, awardLessonCompletionBonus } from "@/actions/challenge-progress";
import { toast } from "sonner";
import Image from "next/image";
import { ResultCard } from "./result-card";
import { useRouter } from "next/navigation";
import Confetti from "@/components/lazy-confetti";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";
import { MathRenderer } from "@/components/ui/math-renderer";
import { SCORING_SYSTEM } from "@/constants";
import { getTimeBonusInfo } from "@/lib/time-bonus";
import { emitProgressUpdated } from "@/lib/progress-events";
import { Target, Sunrise } from "lucide-react";

type Props = {
  initialPercentage: number;
  initialHearts: number;
  initialPoints: number;
  initialLessonId: number;
  initialLessonChallenges: (typeof challenges.$inferSelect & {
    completed: boolean;
    challengeOptions: (typeof challengeOptions.$inferSelect)[];
  })[];
  /**
   * Active subscription row (or `null` if the user is on the free tier).
   *
   * We pin this to the Drizzle row type instead of `any` so bad prop
   * shapes fail at compile time — historically this was `unknown` and a
   * silent nullability drift would only surface as a runtime "cannot
   * read property status of undefined" deep inside the quiz render.
   *
   * The in-quiz logic reads almost nothing off this object today —
   * `hasInfiniteHearts` is computed server-side and passed separately —
   * but the prop is retained so the call-site contract with
   * `app/lesson/page.tsx` stays explicit, and so a future "upgrade to
   * unlock feature X" affordance can read `subscription.status` /
   * `subscription.endDate` without another round of plumbing.
   */
  userSubscription: typeof userSubscriptions.$inferSelect | null;
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
  const sequenceListRef = useRef<SequenceChallengeHandle | null>(null);

  const [lessonId] = useState(initialLessonId);
  const [hearts, setHearts] = useState(initialHearts);
  const [lessonPoints, setLessonPoints] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lessonBonuses, setLessonBonuses] = useState<{
    completionBonus: number;
    perfectBonus: number;
  } | null>(null);

  const [timeBonusInfo] = useState(() => getTimeBonusInfo());
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
          const bonusTotal = bonuses.completionBonus + bonuses.perfectBonus;
          setLessonPoints((prev) => prev + bonusTotal);
          if (bonusTotal > 0) {
            emitProgressUpdated({ source: "lesson-complete", points: bonusTotal });
          }
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
                  <span className="text-emerald-700 font-medium"><Target className="w-4 h-4 inline" /> Hatasız ders bonusu!</span>
                  <span className="font-bold text-emerald-600">
                    +{lessonBonuses.perfectBonus}
                  </span>
                </div>
              )}
              {timeBonusInfo.multiplier > 1 && (
                <div className="flex justify-between items-center px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span className="text-yellow-700 font-medium">
                    <Sunrise className="w-4 h-4 inline mr-1" />
                    {timeBonusInfo.label}
                  </span>
                  <span className="font-bold text-yellow-600">
                    x{timeBonusInfo.multiplier}
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
            <ResultCard variant="points" value={Math.max(0, lessonPoints)} />
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

  const onPairMistake = () => {
    if (isPracticeMode) {
      incorrectControls.play();
      return;
    }
    startTransition(() => {
      reduceHearts(challenge.id)
        .then((response) => {
          if (response?.error === "hearts") {
            openHeartsModal();
            return;
          }
          incorrectControls.play();
          setWrongCount((c) => c + 1);
          if (!response?.error && !hasInfiniteHearts) {
            setHearts((prev) => Math.max(prev - 1, 0));
            setLessonPoints(
              (prev) => prev + SCORING_SYSTEM.LESSON_CHALLENGE_PENALTY
            );
          }
        })
        .catch(() => toast.error("Bir şeyler yanlış gitti. Lütfen tekrar deneyin."));
    });
  };
  const title =
    type === "ASSIST"
      ? "Doğru cevapladığına emin misin?"
      : type === "FILL_BLANK"
        ? "Boşluğa uygun seçeneği seçin"
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
              setLessonPoints((prev) => prev + SCORING_SYSTEM.LESSON_CHALLENGE_PENALTY);
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
    if (status === "correct") {
      onNext();
      return;
    }
    if (status !== "none") return;

    if (type === "SEQUENCE" || type === "MATCH_PAIRS") {
      if (selectedOption !== READY_TO_CHECK) return;
    } else if (selectedOption === undefined) {
      return;
    }

    let isAnswerCorrect: boolean;

    if (selectedOption === ANSWER_CORRECT) {
      isAnswerCorrect = true;
    } else if (selectedOption === ANSWER_WRONG) {
      isAnswerCorrect = false;
    } else if (type === "SEQUENCE" && selectedOption === READY_TO_CHECK) {
      isAnswerCorrect = sequenceListRef.current?.isOrderCorrect() === true;
    } else if (type === "MATCH_PAIRS" && selectedOption === READY_TO_CHECK) {
      isAnswerCorrect = true;
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
            setPercentage((prev) => Math.min(prev + 100 / challenges.length, 100));

            if (isPracticeMode) {
              setLessonPoints((prev) => prev + SCORING_SYSTEM.LESSON_CHALLENGE_PRACTICE);
              emitProgressUpdated({
                source: "quiz-correct-practice",
                points: SCORING_SYSTEM.LESSON_CHALLENGE_PRACTICE,
              });
            } else {
              setLessonPoints((prev) => prev + SCORING_SYSTEM.LESSON_CHALLENGE_FIRST);
              emitProgressUpdated({
                source: "quiz-correct-first",
                points: SCORING_SYSTEM.LESSON_CHALLENGE_FIRST,
              });
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
              setLessonPoints((prev) => prev + SCORING_SYSTEM.LESSON_CHALLENGE_PENALTY);
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
            <div className="lg:min-h-[350px] lg:w-[600px] w-full px-6 lg:px-0 flex flex-col gap-y-12">
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
                disabled={pending || status !== "none"}
                type={type}
                question={challenge.question}
                questionImageSrc={challenge.questionImageSrc}
                timeLimit={timeLimit || undefined}
                onTimeUp={handleTimeUp}
                onPairMistake={onPairMistake}
                sequenceListRef={sequenceListRef}
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
