"use client";

import { challengeOptions, challenges } from "@/db/schema";
import { useEffect, useRef, useState, useTransition } from "react";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { Challenge } from "./challenge";
import { Footer } from "./footer";
import { upsertChallengeProgress } from "@/actions/challenge-progress";
import { toast } from "sonner";
import { reduceHearts } from "@/actions/user-progress";
import Image from "next/image";
import { ResultCard } from "./result-card";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";

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
  
  const controls = {
    play: () => audioRef.current?.play().catch(console.error)
  };
  
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
  }, [callback]);
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

  // If initialPercentage === 100 (all questions complete), practice
  const [percentage, setPercentage] = useState(() =>
    initialPercentage === 100 ? 0 : initialPercentage
  );

  const [challenges] = useState(initialLessonChallenges);

  // Find active (not yet completed) challenge
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = challenges.findIndex((c) => !c.completed);
    return idx === -1 ? 0 : idx;
  });

  const [selectedOption, setSelectedOption] = useState<number>();
  const [status, setStatus] = useState<"correct" | "wrong" | "none">("none");

  useMount(() => {
    if (initialPercentage === 100) {
      openPracticeModal();
    }
  });

  // *******************************
  // 3) Check if lesson finished
  // *******************************
  const challenge = challenges[activeIndex];
  const lessonFinished = !challenge;

  // Play finish audio once when lesson is complete
  useEffect(() => {
    if (lessonFinished && !finishPlayedRef.current) {
      finishPlayedRef.current = true;
      finishControls.play();
    }
  }, [lessonFinished, finishControls]);

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
            alt="Finish"
            className="hidden lg:block"
            height={100}
            width={100}
          />
          <Image
            src="/finish.svg"
            alt="Finish"
            className="block lg:hidden"
            height={50}
            width={50}
          />
          <h1 className="text-xl lg:text-3xl font-bold text-neutral-700">
            Tebrikler! <br />
            Dersi tamamladın.
          </h1>
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
    type === "ASSIST" ? "Select the correct meaning" : challenge.question;

  // Handle timer expiration
  const handleTimeUp = () => {
    if (status === "none") {
      // Time expired - treat as wrong answer
      startTransition(() => {
        reduceHearts(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            incorrectControls.play();
            setStatus("wrong");
            if (!response?.error) {
              setHearts((prev) => Math.max(prev - 1, 0));
              setPoints((prev) => prev - 10);
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
    // If already in 'wrong' or 'correct' state => Next step
    if (status === "wrong") {
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }
    
    // For normal answer checking, we need a selected option
    if (!selectedOption) return;
    if (status === "correct") {
      onNext();
      return;
    }

    // Check the answer
    const correctOption = challengeOptions.find((o) => o.correct);
    if (!correctOption) return;

    if (correctOption.id === selectedOption) {
      // Answer is correct
      startTransition(() => {
        upsertChallengeProgress(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }
            correctControls.play();
            setStatus("correct");
            setPercentage((prev) => prev + 100 / challenges.length);

            if (initialPercentage === 100) {
              // Practice mode: only award points, no hearts
              setPoints((prev) => prev + 20);
            } else {
              // First time: award points only
              setPoints((prev) => prev + 10);
            }
          })
          .catch(() => toast.error("Bir şeyler yanlış gitti. Lütfen tekrar deneyin."));
      });
    } else {
      // Answer is wrong
      startTransition(() => {
        reduceHearts(challenge.id)
          .then((response) => {
            if (response?.error === "hearts") {
              openHeartsModal();
              return;
            }

            incorrectControls.play();
            setStatus("wrong");
            if (!response?.error) {
              setHearts((prev) => Math.max(prev - 1, 0));
              setPoints((prev) => prev - 10);
            }
          })
          .catch(() => toast.error("Bir şeyler yanlış gitti. Lütfen tekrar deneyin."));
      });
    }
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
              {title}
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
                timeLimit={timeLimit || undefined}
                onTimeUp={handleTimeUp}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer
        disabled={pending || (!selectedOption && status === "none")}
        status={status}
        onCheck={onContinue}
        lessonId={lessonId}
      />
    </>
  );
};
