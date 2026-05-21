"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { awardGamePoints } from "@/lib/client-points";
import { SCORING_SYSTEM } from "@/constants";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Zap, Grid3X3, Eye, MousePointerClick } from "lucide-react";
import Link from "next/link";

type Difficulty = "Kolay" | "Orta" | "Zor" | "Uzman";
type GameState = "menu" | "showing" | "input" | "success" | "finished";

const CONFIG = SCORING_SYSTEM.GAMES.MEMORY_MATRIX;

const DIFFICULTY_SETTINGS: Record<
  Difficulty,
  { startGrid: number; startTiles: number; displayMs: number }
> = {
  Kolay: { startGrid: 3, startTiles: 3, displayMs: 1500 },
  Orta: { startGrid: 4, startTiles: 4, displayMs: 1200 },
  Zor: { startGrid: 5, startTiles: 5, displayMs: 800 },
  Uzman: { startGrid: 6, startTiles: 7, displayMs: 600 },
};

const MAX_GRID = 7;

function generateTargetTiles(gridSize: number, count: number): Set<number> {
  const total = gridSize * gridSize;
  const tiles = new Set<number>();
  while (tiles.size < Math.min(count, total)) {
    tiles.add(Math.floor(Math.random() * total));
  }
  return tiles;
}

function getGridAndTiles(
  level: number,
  difficulty: Difficulty,
): { gridSize: number; tileCount: number } {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const gridGrowth = Math.floor((level - 1) / 3);
  const gridSize = Math.min(settings.startGrid + gridGrowth, MAX_GRID);
  const tileCount = Math.min(settings.startTiles + (level - 1), gridSize * gridSize - 1);
  return { gridSize, tileCount };
}

function getDisplayTime(level: number, difficulty: Difficulty): number {
  const base = DIFFICULTY_SETTINGS[difficulty].displayMs;
  return Math.max(400, base - (level - 1) * 30);
}

export default function MemoryMatrixGame() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("Kolay");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [bestLevel, setBestLevel] = useState(0);
  const [pointsSubmitted, setPointsSubmitted] = useState(false);

  const [gridSize, setGridSize] = useState(3);
  const [targetTiles, setTargetTiles] = useState<Set<number>>(new Set());
  const [selectedTiles, setSelectedTiles] = useState<Set<number>>(new Set());
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLevel = useCallback(
    (lvl: number) => {
      const { gridSize: gs, tileCount } = getGridAndTiles(lvl, difficulty);
      const targets = generateTargetTiles(gs, tileCount);

      setGridSize(gs);
      setTargetTiles(targets);
      setSelectedTiles(new Set());
      setWrongTile(null);
      setCorrectCount(0);
      setGameState("showing");

      const displayTime = getDisplayTime(lvl, difficulty);
      timeoutRef.current = setTimeout(() => {
        setGameState("input");
      }, displayTime);
    },
    [difficulty],
  );

  const startGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    setBestLevel(0);
    setPointsSubmitted(false);
    startLevel(1);
  }, [startLevel]);

  useEffect(() => {
    if (gameState === "finished" && !pointsSubmitted && score > 0) {
      setPointsSubmitted(true);
      const diffMult = CONFIG.DIFFICULTY_MULTIPLIER[difficulty];
      const finalScore = Math.round(score * diffMult);
      setScore(finalScore);
      awardGamePoints(finalScore, "memory-matrix").catch(() =>
        toast.error("Puanlar kaydedilemedi"),
      );
    }
  }, [gameState, pointsSubmitted, score, difficulty]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleTileClick = (index: number) => {
    if (gameState !== "input") return;
    if (selectedTiles.has(index)) return;

    if (targetTiles.has(index)) {
      const newSelected = new Set(selectedTiles);
      newSelected.add(index);
      setSelectedTiles(newSelected);

      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);

      if (newCorrect === targetTiles.size) {
        const levelPoints = Math.round(
          CONFIG.BASE_POINTS_PER_LEVEL *
            Math.pow(CONFIG.LEVEL_MULTIPLIER, level - 1),
        );
        const noMistakes = wrongTile === null;
        const bonus = noMistakes ? CONFIG.PERFECT_LEVEL_BONUS : 0;
        setScore((prev) => prev + levelPoints + bonus);
        setBestLevel(level);
        setGameState("success");

        const nextLevel = level + 1;
        setLevel(nextLevel);
        timeoutRef.current = setTimeout(() => {
          startLevel(nextLevel);
        }, 800);
      }
    } else {
      setWrongTile(index);
      const newSelected = new Set(selectedTiles);
      newSelected.add(index);
      setSelectedTiles(newSelected);

      setBestLevel(level);
      timeoutRef.current = setTimeout(() => {
        setGameState("finished");
      }, 600);
    }
  };

  const renderGrid = () => {
    const total = gridSize * gridSize;
    const tiles = [];
    const tileSize =
      gridSize <= 4 ? "w-14 h-14 sm:w-16 sm:h-16" : gridSize <= 5 ? "w-12 h-12 sm:w-14 sm:h-14" : "w-10 h-10 sm:w-12 sm:h-12";

    for (let i = 0; i < total; i++) {
      const isTarget = targetTiles.has(i);
      const isSelected = selectedTiles.has(i);
      const isWrong = wrongTile === i;

      let bg: string;
      if (gameState === "showing" && isTarget) {
        bg = "bg-suk-payment/50 border-suk-payment scale-95";
      } else if (gameState === "finished" && isTarget && !isSelected) {
        bg = "bg-suk-payment/25 border-suk-payment/50 opacity-60";
      } else if (isWrong) {
        bg = "bg-suk-danger/50 border-suk-danger animate-shake";
      } else if (isSelected && isTarget) {
        bg = "bg-suk-brand/50 border-suk-brand";
      } else if (gameState === "input") {
        bg =
          "bg-muted border-border active:bg-muted/80 active:scale-90 cursor-pointer";
      } else {
        bg = "bg-muted border-border";
      }

      tiles.push(
        <button
          key={i}
          onClick={() => handleTileClick(i)}
          disabled={gameState !== "input" || isSelected}
          className={`${tileSize} rounded-xl border-2 transition-all duration-200 ${bg}`}
        />,
      );
    }
    return tiles;
  };

  if (gameState === "menu") {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 py-8">
        <Link
          href="/games"
          className="self-start flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" /> Oyunlara Dön
        </Link>

        <div className="text-center">
          <div className="mb-3">
            <Grid3X3 className="w-12 h-12 text-suk-payment mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Hafıza Matrisi
          </h1>
          <p className="text-muted-foreground mt-2">
            Yanan kareleri hatırla ve işaretlediğini unutma!
          </p>
        </div>

        <div className="w-full space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Zorluk</p>
          {(["Kolay", "Orta", "Zor", "Uzman"] as Difficulty[]).map((d) => {
            const s = DIFFICULTY_SETTINGS[d];
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  difficulty === d
                    ? "border-suk-payment bg-suk-payment-soft text-suk-payment-soft-fg"
                    : "border-border hover:border-border/80 text-muted-foreground"
                }`}
              >
                <span className="font-semibold">{d}</span>
                <span className="text-xs ml-2 opacity-70">
                  ({s.startGrid}x{s.startGrid}, {s.startTiles} kare,{" "}
                  {s.displayMs / 1000}sn, x
                  {CONFIG.DIFFICULTY_MULTIPLIER[d]} puan)
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="primary"
          onClick={startGame}
          className="w-full py-6 text-lg"
        >
          Başla
        </Button>
      </div>
    );
  }

  if (gameState === "finished") {
    const diffMult = CONFIG.DIFFICULTY_MULTIPLIER[difficulty];
    const displayScore = pointsSubmitted ? score : Math.round(score * diffMult);

    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 py-8">
        <div className="mb-2">
          <Trophy className="w-12 h-12 text-suk-warning mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Oyun Bitti!</h1>

        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-suk-payment-soft rounded-xl p-4 text-center border border-suk-payment-ring">
            <Trophy className="h-6 w-6 text-suk-payment mx-auto mb-1" />
            <p className="text-2xl font-bold text-suk-payment-soft-fg">{displayScore}</p>
            <p className="text-xs text-suk-payment">Toplam Puan</p>
          </div>
          <div className="bg-suk-warning-soft rounded-xl p-4 text-center border border-suk-warning-border">
            <Zap className="h-6 w-6 text-suk-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-suk-warning-soft-fg">
              Seviye {bestLevel}
            </p>
            <p className="text-xs text-suk-warning">Ulaşılan Seviye</p>
          </div>
        </div>

        {/* Show missed tiles */}
        <div className="w-full">
          <p className="text-sm text-muted-foreground text-center mb-3">
            Kaçırdığın kareler:
          </p>
          <div
            className="grid gap-1.5 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              maxWidth: `${gridSize * 48}px`,
            }}
          >
            {renderGrid()}
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <Button
            variant="primary"
            onClick={startGame}
            className="flex-1 py-5"
          >
            Tekrar Oyna
          </Button>
          <Link prefetch={false} href="/games" className="flex-1">
            <Button
              variant="outline"
              className="w-full py-5"
            >
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
          <Trophy className="h-5 w-5 text-suk-payment" />
          <span className="font-bold text-lg text-suk-payment-soft-fg">{score}</span>
        </div>
        <div className="bg-suk-payment-soft rounded-full px-4 py-1">
          <span className="font-bold text-suk-payment-soft-fg">Seviye {level}</span>
        </div>
      </div>

      {/* Status */}
      <div className="text-center min-h-[32px]">
        {gameState === "showing" && (
          <div className="flex items-center justify-center gap-2 text-lg font-semibold text-suk-warning animate-pulse">
            <Eye className="w-5 h-5" />
            <span>Kareleri ezberle!</span>
          </div>
        )}
        {gameState === "input" && (
          <div className="flex items-center justify-center gap-2 text-lg font-semibold text-suk-payment-soft-fg">
            <MousePointerClick className="w-5 h-5" />
            <span>
              Yanan kareleri seç! ({correctCount}/{targetTiles.size})
            </span>
          </div>
        )}
        {gameState === "success" && (
          <p className="text-lg font-semibold text-suk-brand">
            Doğru! Sonraki seviye...
          </p>
        )}
      </div>

      {/* Grid */}
      <div
        className="grid gap-2 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {renderGrid()}
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 mt-2 flex-wrap justify-center">
        {Array.from(targetTiles).map((_, idx) => (
          <div
            key={idx}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              idx < correctCount ? "bg-suk-brand" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Grid info */}
      <p className="text-xs text-muted-foreground">
        {gridSize}x{gridSize} izgara / {targetTiles.size} kare /{" "}
        {difficulty}
      </p>
    </div>
  );
}
