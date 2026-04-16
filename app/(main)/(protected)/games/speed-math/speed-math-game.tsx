"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addPointsToUser } from "@/actions/challenge-progress";
import { SCORING_SYSTEM } from "@/constants";
import { toast } from "sonner";
import { ArrowLeft, Zap, Trophy, Timer, Target, Check, X } from "lucide-react";
import Link from "next/link";

type Difficulty = "Kolay" | "Orta" | "Zor" | "Uzman";

interface Question {
  text: string;
  answer: number;
  options: number[];
}

const CONFIG = SCORING_SYSTEM.GAMES.SPEED_MATH;

function generateQuestion(difficulty: Difficulty): Question {
  let a: number, b: number, answer: number, text: string;

  const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  switch (difficulty) {
    case "Kolay": {
      const op = Math.random() < 0.5 ? "+" : "-";
      a = rand(1, 20);
      b = rand(1, 20);
      if (op === "-" && b > a) [a, b] = [b, a];
      answer = op === "+" ? a + b : a - b;
      text = `${a} ${op} ${b}`;
      break;
    }
    case "Orta": {
      const ops = ["+", "-", "×"];
      const op = ops[rand(0, 2)];
      if (op === "×") {
        a = rand(2, 12);
        b = rand(2, 12);
        answer = a * b;
      } else {
        a = rand(10, 99);
        b = rand(10, 99);
        if (op === "-" && b > a) [a, b] = [b, a];
        answer = op === "+" ? a + b : a - b;
      }
      text = `${a} ${op} ${b}`;
      break;
    }
    case "Zor": {
      const type = rand(0, 2);
      if (type === 0) {
        a = rand(10, 50);
        b = rand(2, 12);
        answer = a * b;
        text = `${a} × ${b}`;
      } else if (type === 1) {
        b = rand(2, 12);
        answer = rand(2, 20);
        a = b * answer;
        text = `${a} ÷ ${b}`;
      } else {
        a = rand(10, 50);
        b = rand(10, 50);
        const c = rand(1, 20);
        const op1 = Math.random() < 0.5 ? "+" : "-";
        const op2 = Math.random() < 0.5 ? "+" : "-";
        const r1 = op1 === "+" ? a + b : a - b;
        answer = op2 === "+" ? r1 + c : r1 - c;
        text = `${a} ${op1} ${b} ${op2} ${c}`;
      }
      break;
    }
    case "Uzman": {
      const type = rand(0, 2);
      if (type === 0) {
        a = rand(2, 12);
        b = rand(2, 12);
        const c = rand(1, 30);
        answer = a * b + c;
        text = `${a} × ${b} + ${c}`;
      } else if (type === 1) {
        a = rand(10, 50);
        b = rand(2, 9);
        const c = rand(2, 9);
        answer = a + b * c;
        text = `${a} + ${b} × ${c}`;
      } else {
        a = rand(2, 15);
        b = rand(2, 15);
        const c = rand(2, 9);
        answer = (a + b) * c;
        text = `(${a} + ${b}) × ${c}`;
      }
      break;
    }
  }

  const options = generateOptions(answer);
  return { text, answer, options };
}

function generateOptions(correctAnswer: number): number[] {
  const options = new Set<number>([correctAnswer]);
  const range = Math.max(10, Math.abs(correctAnswer) * 0.3);

  while (options.size < 4) {
    const offset = Math.floor(Math.random() * range) + 1;
    const wrong = Math.random() < 0.5
      ? correctAnswer + offset
      : correctAnswer - offset;
    if (wrong !== correctAnswer) options.add(wrong);
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
}

type GameState = "menu" | "playing" | "finished";

export default function SpeedMathGame() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("Kolay");
  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(CONFIG.GAME_DURATION_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [pointsSubmitted, setPointsSubmitted] = useState(false);

  const questionStartTime = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const comboMultiplier = Math.min(
    CONFIG.MAX_COMBO_MULTIPLIER,
    1 + combo * CONFIG.COMBO_MULTIPLIER_STEP
  );

  const diffMultiplier =
    CONFIG.DIFFICULTY_MULTIPLIER[difficulty];

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(difficulty));
    setSelectedAnswer(null);
    setIsCorrect(null);
    questionStartTime.current = Date.now();
  }, [difficulty]);

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setWrongCount(0);
    setTimeLeft(CONFIG.GAME_DURATION_SECONDS);
    setPointsSubmitted(false);
    setGameState("playing");
  };

  useEffect(() => {
    if (gameState === "playing") {
      nextQuestion();
    }
  }, [gameState, nextQuestion]);

  useEffect(() => {
    if (gameState !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setGameState("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === "finished" && !pointsSubmitted && score > 0) {
      setPointsSubmitted(true);
      addPointsToUser(score).catch(() =>
        toast.error("Puanlar kaydedilemedi")
      );
    }
  }, [gameState, pointsSubmitted, score]);

  const handleAnswer = (selected: number) => {
    if (selectedAnswer !== null || gameState !== "playing") return;

    setSelectedAnswer(selected);
    const correct = selected === question?.answer;
    setIsCorrect(correct);

    const elapsed = Date.now() - questionStartTime.current;

    if (correct) {
      const speedBonus =
        elapsed < CONFIG.SPEED_BONUS_THRESHOLD_MS ? CONFIG.SPEED_BONUS : 0;
      const basePoints = CONFIG.CORRECT_ANSWER + speedBonus;
      const points = Math.round(basePoints * comboMultiplier * diffMultiplier);

      setScore((prev) => prev + points);
      setCombo((prev) => {
        const next = prev + 1;
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });
      setCorrectCount((prev) => prev + 1);
    } else {
      setCombo(0);
      setWrongCount((prev) => prev + 1);
    }

    setTimeout(() => nextQuestion(), correct ? 300 : 800);
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
          <div className="mb-3"><Zap className="w-12 h-12 text-yellow-500 mx-auto" /></div>
          <h1 className="text-2xl font-bold text-neutral-800">
            Hız Matematiği
          </h1>
          <p className="text-neutral-500 mt-2">
            60 saniyede mümkün olduğunca çok doğru cevap ver!
          </p>
        </div>

        <div className="w-full space-y-3">
          <p className="text-sm font-semibold text-neutral-600 text-center">
            Zorluk Seviyesi
          </p>
          {(["Kolay", "Orta", "Zor", "Uzman"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                difficulty === d
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
              }`}
            >
              <span className="font-semibold">{d}</span>
              <span className="text-xs ml-2 opacity-70">
                (×{CONFIG.DIFFICULTY_MULTIPLIER[d]} puan)
              </span>
            </button>
          ))}
        </div>

        <Button
          onClick={startGame}
          className="w-full py-6 text-lg font-bold bg-amber-500 hover:bg-amber-600"
        >
          Başla
        </Button>
      </div>
    );
  }

  if (gameState === "finished") {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 py-8">
        <div className="mb-2"><Trophy className="w-12 h-12 text-amber-500 mx-auto" /></div>
        <h1 className="text-2xl font-bold text-neutral-800">Süre Doldu!</h1>

        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
            <Trophy className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">{score}</p>
            <p className="text-xs text-amber-500">Toplam Puan</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
            <Target className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{correctCount}</p>
            <p className="text-xs text-green-500">Doğru Cevap</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
            <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
            <p className="text-xs text-red-500">Yanlış Cevap</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
            <Zap className="h-6 w-6 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-600">{maxCombo}×</p>
            <p className="text-xs text-purple-500">En Yüksek Kombo</p>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <Button
            onClick={startGame}
            className="flex-1 py-5 font-bold bg-amber-500 hover:bg-amber-600"
          >
            Tekrar Oyna
          </Button>
          <Link href="/games" className="flex-1">
            <Button variant="secondaryOutline" className="w-full py-5 font-bold">
              Oyunlara Dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 py-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span className="font-bold text-lg text-amber-600">{score}</span>
        </div>
        <div className="flex items-center gap-2 bg-neutral-100 rounded-full px-3 py-1">
          <Timer className="h-4 w-4 text-neutral-500" />
          <span
            className={`font-mono font-bold text-lg ${
              timeLeft <= 10 ? "text-red-500" : "text-neutral-700"
            }`}
          >
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            timeLeft <= 10 ? "bg-red-500" : "bg-amber-500"
          }`}
          style={{
            width: `${(timeLeft / CONFIG.GAME_DURATION_SECONDS) * 100}%`,
          }}
        />
      </div>

      {/* Combo */}
      {combo > 0 && (
        <div className="flex items-center gap-1 text-purple-600 font-bold animate-pulse">
          <Zap className="h-4 w-4" />
          <span>
            {combo} Kombo! (×{comboMultiplier.toFixed(2)})
          </span>
        </div>
      )}

      {/* Question */}
      {question && (
        <div className="w-full flex flex-col items-center gap-6 mt-4">
          <div
            className={`text-4xl sm:text-5xl font-bold text-neutral-800 p-8 rounded-2xl border-2 w-full text-center transition-colors ${
              isCorrect === true
                ? "bg-green-50 border-green-300"
                : isCorrect === false
                  ? "bg-red-50 border-red-300"
                  : "bg-white border-neutral-200"
            }`}
          >
            {question.text} = ?
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {question.options.map((option, idx) => {
              let btnClass =
                "p-4 rounded-xl border-2 text-xl font-bold transition-all ";

              if (selectedAnswer !== null) {
                if (option === question.answer) {
                  btnClass += "border-green-500 bg-green-50 text-green-700";
                } else if (option === selectedAnswer) {
                  btnClass += "border-red-500 bg-red-50 text-red-700";
                } else {
                  btnClass += "border-neutral-200 text-neutral-400";
                }
              } else {
                btnClass +=
                  "border-neutral-200 hover:border-amber-400 hover:bg-amber-50 text-neutral-700 active:scale-95 cursor-pointer";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={btnClass}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="w-full flex justify-center gap-4 text-sm text-neutral-500 mt-2">
        <span className="text-green-600"><Check className="w-4 h-4 inline" /> {correctCount}</span>
        <span className="text-red-500"><X className="w-4 h-4 inline" /> {wrongCount}</span>
        <span className="text-neutral-600">{difficulty}</span>
      </div>
    </div>
  );
}
