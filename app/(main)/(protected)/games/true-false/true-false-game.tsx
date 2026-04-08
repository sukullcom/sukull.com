"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { addPointsToUser } from "@/actions/challenge-progress";
import { SCORING_SYSTEM } from "@/constants";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Heart, Zap, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

type Category = "matematik" | "ingilizce" | "bilim" | "genel";

const CONFIG = SCORING_SYSTEM.GAMES.TRUE_FALSE;

interface Statement {
  text: string;
  isTrue: boolean;
  category: Category;
}

const CATEGORY_LABELS: Record<Category, string> = {
  matematik: "Matematik",
  ingilizce: "İngilizce",
  bilim: "Bilim",
  genel: "Genel Kültür",
};

function generateMathStatement(): Statement {
  const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const type = rand(0, 4);
  let text: string;
  let isTrue: boolean;

  switch (type) {
    case 0: {
      const a = rand(2, 15);
      const b = rand(2, 15);
      const correct = a * b;
      isTrue = Math.random() < 0.5;
      const shown = isTrue ? correct : correct + rand(1, 5) * (Math.random() < 0.5 ? 1 : -1);
      text = `${a} × ${b} = ${shown}`;
      break;
    }
    case 1: {
      const a = rand(10, 99);
      const b = rand(10, 99);
      const correct = a + b;
      isTrue = Math.random() < 0.5;
      const shown = isTrue ? correct : correct + rand(1, 10) * (Math.random() < 0.5 ? 1 : -1);
      text = `${a} + ${b} = ${shown}`;
      break;
    }
    case 2: {
      const bases = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
      const base = bases[rand(0, bases.length - 1)];
      const correct = Math.sqrt(base);
      isTrue = Math.random() < 0.5;
      const shown = isTrue ? correct : correct + rand(1, 3) * (Math.random() < 0.5 ? 1 : -1);
      text = `√${base} = ${shown}`;
      break;
    }
    case 3: {
      const a = rand(2, 12);
      isTrue = Math.random() < 0.5;
      const correct = a * a;
      const shown = isTrue ? correct : correct + rand(1, 5);
      text = `${a}² = ${shown}`;
      break;
    }
    default: {
      const a = rand(20, 99);
      const b = rand(10, a);
      const correct = a - b;
      isTrue = Math.random() < 0.5;
      const shown = isTrue ? correct : correct + rand(1, 8) * (Math.random() < 0.5 ? 1 : -1);
      text = `${a} - ${b} = ${shown}`;
      break;
    }
  }

  return { text, isTrue, category: "matematik" };
}

const ENGLISH_STATEMENTS: Statement[] = [
  { text: '"Apple" = Elma', isTrue: true, category: "ingilizce" },
  { text: '"Dog" = Kedi', isTrue: false, category: "ingilizce" },
  { text: '"Blue" = Mavi', isTrue: true, category: "ingilizce" },
  { text: '"Monday" = Salı', isTrue: false, category: "ingilizce" },
  { text: '"Happy" = Mutlu', isTrue: true, category: "ingilizce" },
  { text: '"Sun" = Ay', isTrue: false, category: "ingilizce" },
  { text: '"Three" = Üç', isTrue: true, category: "ingilizce" },
  { text: '"Winter" = Yaz', isTrue: false, category: "ingilizce" },
  { text: '"Mother" = Anne', isTrue: true, category: "ingilizce" },
  { text: '"Fast" = Yavaş', isTrue: false, category: "ingilizce" },
  { text: '"Read" = Okumak', isTrue: true, category: "ingilizce" },
  { text: '"Big" = Küçük', isTrue: false, category: "ingilizce" },
  { text: '"Night" = Gece', isTrue: true, category: "ingilizce" },
  { text: '"Sister" = Erkek Kardeş', isTrue: false, category: "ingilizce" },
  { text: '"Green" = Yeşil', isTrue: true, category: "ingilizce" },
  { text: '"Eat" = İçmek', isTrue: false, category: "ingilizce" },
  { text: '"Love" = Sevgi', isTrue: true, category: "ingilizce" },
  { text: '"Cold" = Sıcak', isTrue: false, category: "ingilizce" },
  { text: '"Bird" = Kuş', isTrue: true, category: "ingilizce" },
  { text: '"Hand" = Ayak', isTrue: false, category: "ingilizce" },
];

const SCIENCE_STATEMENTS: Statement[] = [
  { text: "Su 100°C'de kaynar", isTrue: true, category: "bilim" },
  { text: "Güneş bir gezegendir", isTrue: false, category: "bilim" },
  { text: "İnsan vücudunun %60'ı sudur", isTrue: true, category: "bilim" },
  { text: "Ses ışıktan hızlı yayılır", isTrue: false, category: "bilim" },
  { text: "DNA çift sarmal yapıdadır", isTrue: true, category: "bilim" },
  { text: "Oksijen sembolü O₂'dir", isTrue: true, category: "bilim" },
  { text: "Dünya Güneş'e en yakın gezegendir", isTrue: false, category: "bilim" },
  { text: "Elmasın hammaddesi karbondur", isTrue: true, category: "bilim" },
  { text: "Bitkiler karbondioksit üretir", isTrue: false, category: "bilim" },
  { text: "Kan gruplarından biri AB'dir", isTrue: true, category: "bilim" },
  { text: "Işık boşlukta yayılmaz", isTrue: false, category: "bilim" },
  { text: "Yerçekimi kuvveti kütleye bağlıdır", isTrue: true, category: "bilim" },
  { text: "Ay kendi ışığını üretir", isTrue: false, category: "bilim" },
  { text: "İnsan kalbinde 4 odacık vardır", isTrue: true, category: "bilim" },
  { text: "Azot atmosferin %21'ini oluşturur", isTrue: false, category: "bilim" },
];

const GENERAL_STATEMENTS: Statement[] = [
  { text: "Türkiye'nin başkenti Ankara'dır", isTrue: true, category: "genel" },
  { text: "İstanbul iki kıtada yer alır", isTrue: true, category: "genel" },
  { text: "Fransa'nın başkenti Londra'dır", isTrue: false, category: "genel" },
  { text: "Dünyanın en uzun nehri Nil'dir", isTrue: true, category: "genel" },
  { text: "Japonya'nın başkenti Pekin'dir", isTrue: false, category: "genel" },
  { text: "Everest dünyanın en yüksek dağıdır", isTrue: true, category: "genel" },
  { text: "Brezilya Avrupa'da yer alır", isTrue: false, category: "genel" },
  { text: "Satranç tahtasında 64 kare vardır", isTrue: true, category: "genel" },
  { text: "Olimpiyatlar 5 yılda bir yapılır", isTrue: false, category: "genel" },
  { text: "Futbol takımı 11 kişiden oluşur", isTrue: true, category: "genel" },
  { text: "Mars'a Kızıl Gezegen denir", isTrue: true, category: "genel" },
  { text: "Avustralya bir ada kıtasıdır", isTrue: true, category: "genel" },
  { text: "İtalya'nın para birimi Pound'dur", isTrue: false, category: "genel" },
  { text: "Mısır piramitleri Asya'dadır", isTrue: false, category: "genel" },
  { text: "Satrançta şah en değerli taştır", isTrue: true, category: "genel" },
];

function getStatement(category: Category): Statement {
  if (category === "matematik") return generateMathStatement();

  const pools: Record<Exclude<Category, "matematik">, Statement[]> = {
    ingilizce: ENGLISH_STATEMENTS,
    bilim: SCIENCE_STATEMENTS,
    genel: GENERAL_STATEMENTS,
  };

  const pool = pools[category];
  return pool[Math.floor(Math.random() * pool.length)];
}

type GameState = "menu" | "playing" | "finished";

export default function TrueFalseGame() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [category, setCategory] = useState<Category>("matematik");
  const [statement, setStatement] = useState<Statement | null>(null);
  const [lives, setLives] = useState<number>(CONFIG.LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(CONFIG.BASE_TIME_SECONDS);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [pointsSubmitted, setPointsSubmitted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentTimeLimit = Math.max(
    CONFIG.MIN_TIME_SECONDS,
    CONFIG.BASE_TIME_SECONDS - questionNumber * CONFIG.TIME_DECREASE_PER_QUESTION
  );

  const nextQuestion = useCallback(() => {
    setStatement(getStatement(category));
    setFeedback(null);
    const limit = Math.max(
      CONFIG.MIN_TIME_SECONDS,
      CONFIG.BASE_TIME_SECONDS - (questionNumber + 1) * CONFIG.TIME_DECREASE_PER_QUESTION
    );
    setTimeLeft(limit);
    setQuestionNumber((prev) => prev + 1);
  }, [category, questionNumber]);

  const startGame = () => {
    setLives(CONFIG.LIVES);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setQuestionNumber(0);
    setPointsSubmitted(false);
    setFeedback(null);
    setGameState("playing");
  };

  useEffect(() => {
    if (gameState === "playing" && !statement) {
      nextQuestion();
    }
  }, [gameState, statement, nextQuestion]);

  useEffect(() => {
    if (gameState !== "playing" || feedback !== null) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, feedback, statement]);

  useEffect(() => {
    if (gameState === "finished" && !pointsSubmitted && score > 0) {
      setPointsSubmitted(true);
      addPointsToUser(score).catch(() => toast.error("Puanlar kaydedilemedi"));
    }
  }, [gameState, pointsSubmitted, score]);

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFeedback("timeout");
    setStreak(0);
    setLives((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        feedbackTimeoutRef.current = setTimeout(() => setGameState("finished"), 800);
        return 0;
      }
      feedbackTimeoutRef.current = setTimeout(() => nextQuestion(), 800);
      return next;
    });
  };

  const handleAnswer = (userAnswer: boolean) => {
    if (feedback !== null || !statement || gameState !== "playing") return;
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = userAnswer === statement.isTrue;
    const elapsed = currentTimeLimit - timeLeft;
    const speedRatio = Math.max(0, 1 - elapsed / currentTimeLimit);

    if (isCorrect) {
      setFeedback("correct");
      const speedBonus = speedRatio > 0.5 ? CONFIG.SPEED_BONUS : 0;
      let points = CONFIG.CORRECT_ANSWER + speedBonus;
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak((prev) => Math.max(prev, newStreak));
      setCorrectCount((prev) => prev + 1);
      if (newStreak > 0 && newStreak % CONFIG.STREAK_BONUS_THRESHOLD === 0) {
        points += CONFIG.STREAK_BONUS;
      }
      setScore((prev) => prev + points);
    } else {
      setFeedback("wrong");
      setStreak(0);
      setLives((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          feedbackTimeoutRef.current = setTimeout(() => setGameState("finished"), 800);
          return 0;
        }
        return next;
      });
    }

    if (isCorrect || lives > 1) {
      feedbackTimeoutRef.current = setTimeout(() => nextQuestion(), 600);
    }
  };

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

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
          <div className="text-5xl mb-3">⚡</div>
          <h1 className="text-2xl font-bold text-neutral-800">
            Doğru mu Yanlış mı?
          </h1>
          <p className="text-neutral-500 mt-2">
            Hızlı düşün, doğru karar ver! Süre giderek kısalıyor.
          </p>
        </div>

        <div className="w-full space-y-2">
          <p className="text-sm font-semibold text-neutral-600">Kategori</p>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                category === cat
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
              }`}
            >
              <span className="font-semibold">{CATEGORY_LABELS[cat]}</span>
            </button>
          ))}
        </div>

        <Button
          onClick={startGame}
          className="w-full py-6 text-lg font-bold bg-emerald-500 hover:bg-emerald-600"
        >
          Başla
        </Button>
      </div>
    );
  }

  if (gameState === "finished") {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 py-8">
        <div className="text-5xl mb-2">🏁</div>
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
            onClick={() => {
              setStatement(null);
              startGame();
            }}
            className="flex-1 py-5 font-bold bg-emerald-500 hover:bg-emerald-600"
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

  const timerPercent = (timeLeft / currentTimeLimit) * 100;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 py-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: CONFIG.LIVES }).map((_, i) => (
            <Heart
              key={i}
              className={`h-6 w-6 ${
                i < lives
                  ? "fill-red-500 text-red-500"
                  : "text-neutral-300"
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
            timerPercent <= 30 ? "bg-red-500" : timerPercent <= 60 ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Statement */}
      {statement && (
        <div
          className={`w-full p-8 rounded-2xl border-2 text-center transition-colors mt-4 ${
            feedback === "correct"
              ? "bg-green-50 border-green-400"
              : feedback === "wrong"
                ? "bg-red-50 border-red-400"
                : feedback === "timeout"
                  ? "bg-amber-50 border-amber-400"
                  : "bg-white border-neutral-200"
          }`}
        >
          <p className="text-2xl sm:text-3xl font-bold text-neutral-800 leading-relaxed">
            {statement.text}
          </p>
          {feedback === "timeout" && (
            <p className="text-amber-600 text-sm mt-2 font-semibold">
              Süre doldu!
            </p>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4 w-full mt-4">
        <button
          onClick={() => handleAnswer(true)}
          disabled={feedback !== null}
          className={`flex-1 p-5 rounded-xl border-2 font-bold text-lg transition-all active:scale-95 ${
            feedback !== null
              ? "opacity-50 cursor-not-allowed border-neutral-200"
              : "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400"
          }`}
        >
          <CheckCircle className="h-8 w-8 mx-auto mb-1" />
          Doğru
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={feedback !== null}
          className={`flex-1 p-5 rounded-xl border-2 font-bold text-lg transition-all active:scale-95 ${
            feedback !== null
              ? "opacity-50 cursor-not-allowed border-neutral-200"
              : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400"
          }`}
        >
          <XCircle className="h-8 w-8 mx-auto mb-1" />
          Yanlış
        </button>
      </div>
    </div>
  );
}
