"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { awardGamePoints } from "@/lib/client-points";
import { SCORING_SYSTEM } from "@/constants";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Zap, Target, Timer } from "lucide-react";
import Link from "next/link";

type Mode = "colors" | "numbers" | "mixed" | "timed";

const CONFIG = SCORING_SYSTEM.GAMES.PATTERN_MEMORY;

const COLORS = [
  { id: 0, bg: "bg-red-500", active: "bg-red-300", border: "border-red-600" },
  { id: 1, bg: "bg-blue-500", active: "bg-blue-300", border: "border-blue-600" },
  { id: 2, bg: "bg-green-500", active: "bg-green-300", border: "border-green-600" },
  { id: 3, bg: "bg-yellow-500", active: "bg-yellow-300", border: "border-yellow-600" },
];

const MODE_LABELS: Record<Mode, string> = {
  colors: "Renkler",
  numbers: "Rakamlar",
  mixed: "Karışık",
  timed: "Zamanlı",
};

const TIMED_INPUT_MS = 2000;

type GameState = "menu" | "showing" | "input" | "success" | "finished";

export default function PatternMemoryGame() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [mode, setMode] = useState<Mode>("colors");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [bestLevel, setBestLevel] = useState(0);
  const [pointsSubmitted, setPointsSubmitted] = useState(false);
  const [, setTimedDeadline] = useState<number | null>(null);
  const [timedProgress, setTimedProgress] = useState(100);

  const showingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const gridNumbers = useRef<number[]>([]);

  useEffect(() => {
    gridNumbers.current = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 9) + 1
    );
  }, []);

  const addToSequence = useCallback(() => {
    const next = Math.floor(Math.random() * 4);
    setSequence((prev) => {
      const newSeq = [...prev, next];
      playSequence(newSeq);
      return newSeq;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playSequence = (seq: number[]) => {
    showingRef.current = true;
    setGameState("showing");
    setPlayerInput([]);

    let i = 0;
    const interval = Math.max(300, 600 - level * 20);

    const showNext = () => {
      if (i < seq.length) {
        setActiveButton(seq[i]);
        timeoutRef.current = setTimeout(() => {
          setActiveButton(null);
          i++;
          timeoutRef.current = setTimeout(showNext, 200);
        }, interval);
      } else {
        showingRef.current = false;
        setGameState("input");
      }
    };

    timeoutRef.current = setTimeout(showNext, 500);
  };

  const startGame = () => {
    setSequence([]);
    setPlayerInput([]);
    setLevel(1);
    setScore(0);
    setBestLevel(0);
    setPointsSubmitted(false);
    setActiveButton(null);
    setGameState("showing");

    const first = Math.floor(Math.random() * 4);
    const seq = [first];
    setSequence(seq);
    gridNumbers.current = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 9) + 1
    );
    setTimeout(() => playSequence(seq), 600);
  };

  useEffect(() => {
    if (gameState === "finished" && !pointsSubmitted && score > 0) {
      setPointsSubmitted(true);
      awardGamePoints(score, "pattern-memory").catch(() => toast.error("Puanlar kaydedilemedi"));
    }
  }, [gameState, pointsSubmitted, score]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode !== "timed" || gameState !== "input") {
      setTimedDeadline(null);
      setTimedProgress(100);
      if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
      return;
    }

    const deadline = Date.now() + TIMED_INPUT_MS;
    setTimedDeadline(deadline);
    setTimedProgress(100);

    timedIntervalRef.current = setInterval(() => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
        setTimedProgress(0);
        const modeMult = CONFIG.MODE_MULTIPLIER[mode];
        const finalScore = Math.round(score * modeMult);
        setScore(finalScore);
        setBestLevel(level);
        setGameState("finished");
      } else {
        setTimedProgress((remaining / TIMED_INPUT_MS) * 100);
      }
    }, 50);

    return () => {
      if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, mode, sequence.length]);

  const handleButtonPress = (buttonId: number) => {
    if (gameState !== "input" || showingRef.current) return;

    setActiveButton(buttonId);
    setTimeout(() => setActiveButton(null), 150);

    const newInput = [...playerInput, buttonId];
    setPlayerInput(newInput);

    const idx = newInput.length - 1;
    if (newInput[idx] !== sequence[idx]) {
      if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
      const modeMult = CONFIG.MODE_MULTIPLIER[mode];
      const finalScore = Math.round(score * modeMult);
      setScore(finalScore);
      setBestLevel(level);
      setGameState("finished");
      return;
    }

    if (mode === "timed" && timedIntervalRef.current) {
      clearInterval(timedIntervalRef.current);
      const deadline = Date.now() + TIMED_INPUT_MS;
      setTimedDeadline(deadline);
      setTimedProgress(100);
      timedIntervalRef.current = setInterval(() => {
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
          setTimedProgress(0);
          const modeMult = CONFIG.MODE_MULTIPLIER[mode];
          const finalScore = Math.round(score * modeMult);
          setScore(finalScore);
          setBestLevel(level);
          setGameState("finished");
        } else {
          setTimedProgress((remaining / TIMED_INPUT_MS) * 100);
        }
      }, 50);
    }

    if (newInput.length === sequence.length) {
      if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
      const levelPoints = Math.round(
        CONFIG.BASE_POINTS_PER_LEVEL * Math.pow(CONFIG.LEVEL_MULTIPLIER, level - 1)
      );
      setScore((prev) => prev + levelPoints);
      setLevel((prev) => prev + 1);
      setGameState("success");

      timeoutRef.current = setTimeout(() => {
        addToSequence();
      }, 800);
    }
  };

  const renderButton = (id: number) => {
    const color = COLORS[id];
    const isActive = activeButton === id;
    const isInputPhase = gameState === "input";
    const showNumber = mode === "numbers" || mode === "mixed";

    return (
      <button
        key={id}
        onClick={() => handleButtonPress(id)}
        disabled={gameState !== "input"}
        className={`aspect-square rounded-2xl border-4 transition-all duration-150 flex items-center justify-center ${
          color.border
        } ${
          isActive ? color.active + " scale-95 shadow-lg" : color.bg
        } ${
          isInputPhase ? "cursor-pointer hover:opacity-90 active:scale-90" : "cursor-default"
        }`}
      >
        {showNumber && (
          <span className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md">
            {gridNumbers.current[id]}
          </span>
        )}
      </button>
    );
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
          <div className="mb-3"><Target className="w-12 h-12 text-orange-500 mx-auto" /></div>
          <h1 className="text-2xl font-bold text-neutral-800">
            Sıralama Ustası
          </h1>
          <p className="text-neutral-500 mt-2">
            Renklerin sırasını ezberle ve tekrarla! Her turda sıra uzar.
          </p>
        </div>

        <div className="w-full space-y-2">
          <p className="text-sm font-semibold text-neutral-600">Mod</p>
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                mode === m
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
              }`}
            >
              <span className="font-semibold">{MODE_LABELS[m]}</span>
              <span className="text-xs ml-2 opacity-70">
                (×{CONFIG.MODE_MULTIPLIER[m]} puan)
              </span>
            </button>
          ))}
        </div>

        <Button
          variant="super"
          onClick={startGame}
          className="w-full py-6 text-lg"
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
        <h1 className="text-2xl font-bold text-neutral-800">Oyun Bitti!</h1>

        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
            <Trophy className="h-6 w-6 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-600">{score}</p>
            <p className="text-xs text-orange-500">Toplam Puan</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
            <Zap className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">Seviye {bestLevel}</p>
            <p className="text-xs text-amber-500">Ulaşılan Seviye</p>
          </div>
          <div className="col-span-2 bg-neutral-50 rounded-xl p-4 text-center border border-neutral-200">
            <p className="text-lg font-bold text-neutral-700">
              {bestLevel} adımlık sırayı hatırladın!
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <Button
            variant="super"
            onClick={startGame}
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

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6 py-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-orange-500" />
          <span className="font-bold text-lg text-orange-600">{score}</span>
        </div>
        <div className="bg-orange-100 rounded-full px-4 py-1">
          <span className="font-bold text-orange-700">Seviye {level}</span>
        </div>
      </div>

      {/* Timed mode progress bar */}
      {mode === "timed" && gameState === "input" && (
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ease-linear rounded-full ${
              timedProgress <= 30 ? "bg-red-500" : timedProgress <= 60 ? "bg-amber-500" : "bg-orange-500"
            }`}
            style={{ width: `${timedProgress}%` }}
          />
        </div>
      )}

      {/* Status */}
      <div className="text-center">
        {gameState === "showing" && (
          <p className="text-lg font-semibold text-amber-600 animate-pulse">
            İzle...
          </p>
        )}
        {gameState === "input" && (
          <p className="text-lg font-semibold text-orange-600">
            {mode === "timed" ? (
              <span className="flex items-center justify-center gap-1">
                <Timer className="h-5 w-5" />
                Hızlı ol! ({playerInput.length}/{sequence.length})
              </span>
            ) : (
              <>Sıranı tekrarla! ({playerInput.length}/{sequence.length})</>
            )}
          </p>
        )}
        {gameState === "success" && (
          <p className="text-lg font-semibold text-green-600">
            Doğru! Sonraki seviye...
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {renderButton(0)}
        {renderButton(1)}
        {renderButton(2)}
        {renderButton(3)}
      </div>

      {/* Sequence indicator */}
      <div className="flex gap-1 mt-2">
        {sequence.map((_, idx) => (
          <div
            key={idx}
            className={`h-2.5 w-2.5 rounded-full ${
              idx < playerInput.length ? "bg-orange-500" : "bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
