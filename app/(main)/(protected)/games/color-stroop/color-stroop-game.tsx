"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { addPointsToUser } from "@/actions/challenge-progress";
import { SCORING_SYSTEM } from "@/constants";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Heart, Zap, Palette, Flag, CheckCircle } from "lucide-react";
import Link from "next/link";

type Difficulty = "Kolay" | "Orta" | "Zor" | "Uzman";
type QuestionType = "color" | "word" | "neither";
type GameState = "menu" | "playing" | "finished";

const CONFIG = SCORING_SYSTEM.GAMES.STROOP;

interface ColorDef {
  id: string;
  name: string;
  tw: string;
  bg: string;
  hoverBg: string;
  borderColor: string;
}

const ALL_COLORS: ColorDef[] = [
  { id: "red", name: "KIRMIZI", tw: "text-red-500", bg: "bg-red-500", hoverBg: "hover:bg-red-600", borderColor: "border-red-600" },
  { id: "blue", name: "MAVİ", tw: "text-blue-500", bg: "bg-blue-500", hoverBg: "hover:bg-blue-600", borderColor: "border-blue-600" },
  { id: "green", name: "YEŞİL", tw: "text-green-500", bg: "bg-green-500", hoverBg: "hover:bg-green-600", borderColor: "border-green-600" },
  { id: "yellow", name: "SARI", tw: "text-yellow-500", bg: "bg-yellow-500", hoverBg: "hover:bg-yellow-600", borderColor: "border-yellow-600" },
  { id: "orange", name: "TURUNCU", tw: "text-orange-500", bg: "bg-orange-500", hoverBg: "hover:bg-orange-600", borderColor: "border-orange-600" },
  { id: "purple", name: "MOR", tw: "text-purple-500", bg: "bg-purple-500", hoverBg: "hover:bg-purple-600", borderColor: "border-purple-600" },
];

const DIFFICULTY_SETTINGS: Record<Difficulty, {
  colors: number;
  questionTypes: QuestionType[];
  timeSeconds: number;
  lives: number;
}> = {
  Kolay: { colors: 4, questionTypes: ["color"], timeSeconds: 4, lives: 3 },
  Orta: { colors: 4, questionTypes: ["color", "word"], timeSeconds: 3, lives: 3 },
  Zor: { colors: 6, questionTypes: ["color", "word"], timeSeconds: 2.5, lives: 2 },
  Uzman: { colors: 6, questionTypes: ["color", "word", "neither"], timeSeconds: 2, lives: 2 },
};

interface Round {
  wordColor: ColorDef;
  displayColor: ColorDef;
  questionType: QuestionType;
  correctAnswer: string;
  options: ColorDef[];
}

function generateRound(difficulty: Difficulty): Round {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const colors = ALL_COLORS.slice(0, settings.colors);
  const questionType = settings.questionTypes[Math.floor(Math.random() * settings.questionTypes.length)];

  let wordColor: ColorDef;
  let displayColor: ColorDef;

  do {
    wordColor = colors[Math.floor(Math.random() * colors.length)];
    displayColor = colors[Math.floor(Math.random() * colors.length)];
  } while (wordColor.id === displayColor.id);

  let correctAnswer: string;
  if (questionType === "color") {
    correctAnswer = displayColor.id;
  } else if (questionType === "word") {
    correctAnswer = wordColor.id;
  } else {
    const otherColors = colors.filter(c => c.id !== wordColor.id && c.id !== displayColor.id);
    correctAnswer = otherColors[Math.floor(Math.random() * otherColors.length)].id;
  }

  const shuffled = [...colors].sort(() => Math.random() - 0.5);

  return { wordColor, displayColor, questionType, correctAnswer, options: shuffled };
}

const QUESTION_LABELS: Record<QuestionType, string> = {
  color: "Yazının rengini seç",
  word: "Kelimeyi seç",
  neither: "İkisi de değil — diğerini seç",
};

export default function ColorStroopGame() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("Kolay");
  const [round, setRound] = useState<Round | null>(null);
  const [lives, setLives] = useState<number>(CONFIG.LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(CONFIG.BASE_TIME_SECONDS);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [pointsSubmitted, setPointsSubmitted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartRef = useRef<number>(0);

  const ds = DIFFICULTY_SETTINGS[difficulty];

  const currentTimeLimit = Math.max(
    CONFIG.MIN_TIME_SECONDS,
    ds.timeSeconds - questionNumber * CONFIG.TIME_DECREASE_PER_QUESTION
  );

  const nextRound = useCallback(() => {
    const newRound = generateRound(difficulty);
    setRound(newRound);
    setFeedback(null);
    setSelectedId(null);
    const limit = Math.max(
      CONFIG.MIN_TIME_SECONDS,
      ds.timeSeconds - (questionNumber + 1) * CONFIG.TIME_DECREASE_PER_QUESTION
    );
    setTimeLeft(limit);
    setQuestionNumber(prev => prev + 1);
    roundStartRef.current = Date.now();
  }, [difficulty, questionNumber, ds]);

  const startGame = () => {
    setLives(ds.lives);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setQuestionNumber(0);
    setPointsSubmitted(false);
    setFeedback(null);
    setSelectedId(null);
    setRound(null);
    setGameState("playing");
  };

  useEffect(() => {
    if (gameState === "playing" && !round) {
      nextRound();
    }
  }, [gameState, round, nextRound]);

  const handleTimeout = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFeedback("timeout");
    setStreak(0);
    setLives(prev => {
      const next = prev - 1;
      if (next <= 0) {
        feedbackTimeoutRef.current = setTimeout(() => setGameState("finished"), 800);
        return 0;
      }
      feedbackTimeoutRef.current = setTimeout(() => nextRound(), 800);
      return next;
    });
  }, [nextRound]);

  useEffect(() => {
    if (gameState !== "playing" || feedback !== null) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, feedback, round, handleTimeout]);

  useEffect(() => {
    if (gameState === "finished" && !pointsSubmitted && score > 0) {
      setPointsSubmitted(true);
      addPointsToUser(score, { gameType: "stroop" }).catch(() =>
        toast.error("Puanlar kaydedilemedi")
      );
    }
  }, [gameState, pointsSubmitted, score]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const handleAnswer = (colorId: string) => {
    if (feedback !== null || !round || gameState !== "playing") return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedId(colorId);
    const isCorrect = colorId === round.correctAnswer;
    const elapsed = Date.now() - roundStartRef.current;

    if (isCorrect) {
      setFeedback("correct");
      const diffMult = CONFIG.DIFFICULTY_MULTIPLIER[difficulty] ?? 1;
      const speedBonus = elapsed < CONFIG.SPEED_BONUS_THRESHOLD_MS ? CONFIG.SPEED_BONUS : 0;
      let points = CONFIG.CORRECT_ANSWER + speedBonus;
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(prev => Math.max(prev, newStreak));
      setCorrectCount(prev => prev + 1);
      if (newStreak > 0 && newStreak % CONFIG.STREAK_BONUS_THRESHOLD === 0) {
        points += CONFIG.STREAK_BONUS;
      }
      setScore(prev => prev + Math.round(points * diffMult));
      feedbackTimeoutRef.current = setTimeout(() => nextRound(), 500);
    } else {
      setFeedback("wrong");
      setStreak(0);
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) {
          feedbackTimeoutRef.current = setTimeout(() => setGameState("finished"), 800);
          return 0;
        }
        feedbackTimeoutRef.current = setTimeout(() => nextRound(), 800);
        return next;
      });
    }
  };

  if (gameState === "menu") {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 py-8">
        <Link
          href="/games"
          className="self-start flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Oyunlara Dön
        </Link>

        <div className="text-center">
          <div className="mb-3">
            <Palette className="w-12 h-12 text-rose-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800">Renk Tuzağı</h1>
          <p className="text-neutral-500 mt-2">
            Renk ve kelime arasında doğru olanı seç! Stroop etkisine meydan oku.
          </p>
        </div>

        <div className="w-full space-y-2">
          <p className="text-sm font-semibold text-neutral-600">Zorluk</p>
          {(["Kolay", "Orta", "Zor", "Uzman"] as Difficulty[]).map(d => {
            const s = DIFFICULTY_SETTINGS[d];
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  difficulty === d
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                }`}
              >
                <span className="font-semibold">{d}</span>
                <span className="text-xs ml-2 opacity-70">
                  ({s.lives} can, {s.timeSeconds}sn, {s.colors} renk, ×{CONFIG.DIFFICULTY_MULTIPLIER[d]} puan)
                </span>
              </button>
            );
          })}
        </div>

        <Button variant="super" onClick={startGame} className="w-full py-6 text-lg">
          Başla
        </Button>
      </div>
    );
  }

  if (gameState === "finished") {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 py-8">
        <div className="mb-2">
          <Flag className="w-12 h-12 text-neutral-700 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-800">Oyun Bitti!</h1>

        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
            <Trophy className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-600">{score}</p>
            <p className="text-xs text-emerald-500">Toplam Puan</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{correctCount}</p>
            <p className="text-xs text-green-500">Doğru Cevap</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
            <Zap className="h-6 w-6 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-600">{maxStreak}</p>
            <p className="text-xs text-purple-500">En Uzun Seri</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
            <p className="text-2xl font-bold text-amber-600">{questionNumber}</p>
            <p className="text-xs text-amber-500">Toplam Soru</p>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <Button
            variant="super"
            onClick={() => {
              setRound(null);
              startGame();
            }}
            className="flex-1 py-5"
          >
            Tekrar Oyna
          </Button>
          <Link href="/games" className="flex-1">
            <Button variant="superOutline" className="w-full py-5">
              Oyunlara Dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const timerPercent = (timeLeft / currentTimeLimit) * 100;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 py-4">
      {/* HUD */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: ds.lives }).map((_, i) => (
            <Heart
              key={i}
              className={`h-6 w-6 ${
                i < lives ? "fill-red-500 text-red-500" : "text-neutral-300"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <span className="flex items-center gap-1 text-purple-600 font-bold text-sm">
              <Zap className="h-4 w-4" />
              {streak}
            </span>
          )}
          <span className="font-bold text-lg text-emerald-600">{score}</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ease-linear rounded-full ${
            timerPercent <= 30 ? "bg-red-500" : timerPercent <= 60 ? "bg-amber-500" : "bg-rose-400"
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {round && (
        <>
          {/* Question type */}
          <div className="w-full text-center mt-2">
            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              {QUESTION_LABELS[round.questionType]}
            </p>
          </div>

          {/* Stroop word */}
          <div
            className={`w-full p-10 rounded-2xl border-2 text-center transition-colors ${
              feedback === "correct"
                ? "bg-green-50 border-green-400"
                : feedback === "wrong"
                  ? "bg-red-50 border-red-400"
                  : feedback === "timeout"
                    ? "bg-amber-50 border-amber-400"
                    : "bg-white border-neutral-200"
            }`}
          >
            <p className={`text-5xl sm:text-6xl font-extrabold select-none ${round.displayColor.tw}`}>
              {round.wordColor.name}
            </p>
            {feedback === "timeout" && (
              <p className="text-amber-600 text-sm mt-3 font-semibold">Süre doldu!</p>
            )}
          </div>

          {/* Color buttons */}
          <div className={`w-full grid gap-3 mt-2 ${
            round.options.length <= 4 ? "grid-cols-2" : "grid-cols-3"
          }`}>
            {round.options.map(color => {
              const isSelected = selectedId === color.id;
              const isCorrectOption = color.id === round.correctAnswer;
              let btnClasses = `${color.bg} ${color.hoverBg} text-white border-b-4 ${color.borderColor}`;

              if (feedback !== null) {
                if (isCorrectOption) {
                  btnClasses = `${color.bg} text-white ring-4 ring-green-300 border-b-4 ${color.borderColor} scale-105`;
                } else if (isSelected && !isCorrectOption) {
                  btnClasses = "bg-neutral-300 text-neutral-500 border-b-4 border-neutral-400 opacity-60";
                } else {
                  btnClasses = `${color.bg} text-white border-b-4 ${color.borderColor} opacity-40`;
                }
              }

              return (
                <button
                  key={color.id}
                  onClick={() => handleAnswer(color.id)}
                  disabled={feedback !== null}
                  className={`p-4 rounded-xl font-bold text-base transition-all active:scale-95 ${btnClasses} ${
                    feedback !== null ? "cursor-not-allowed" : ""
                  }`}
                >
                  {color.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Footer */}
      <p className="text-xs text-neutral-500 mt-2">
        Soru {questionNumber} · {difficulty} · ×{CONFIG.DIFFICULTY_MULTIPLIER[difficulty]} puan
      </p>
    </div>
  );
}
