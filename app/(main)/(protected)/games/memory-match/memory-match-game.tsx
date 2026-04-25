"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { awardGamePoints } from "@/lib/client-points";
import { SCORING_SYSTEM } from "@/constants";
import { toast } from "sonner";
import { ArrowLeft, Trophy, RotateCcw, Clock, MousePointer, Brain, PartyPopper } from "lucide-react";
import Link from "next/link";

type Difficulty = "Kolay" | "Orta" | "Zor" | "Uzman";
type Category = "ingilizce" | "matematik" | "genel";

const CONFIG = SCORING_SYSTEM.GAMES.MEMORY_MATCH;

const GRID_CONFIG: Record<Difficulty, { pairs: number; cols: number }> = {
  Kolay: { pairs: 6, cols: 3 },
  Orta: { pairs: 8, cols: 4 },
  Zor: { pairs: 10, cols: 4 },
  Uzman: { pairs: 12, cols: 4 },
};

interface CardPair {
  front: string;
  back: string;
}

const CARD_POOLS: Record<Category, CardPair[]> = {
  ingilizce: [
    { front: "Hello", back: "Merhaba" },
    { front: "Goodbye", back: "Hoşça kal" },
    { front: "Thank you", back: "Teşekkürler" },
    { front: "Please", back: "Lütfen" },
    { front: "Water", back: "Su" },
    { front: "Book", back: "Kitap" },
    { front: "House", back: "Ev" },
    { front: "School", back: "Okul" },
    { front: "Friend", back: "Arkadaş" },
    { front: "Family", back: "Aile" },
    { front: "Teacher", back: "Öğretmen" },
    { front: "Student", back: "Öğrenci" },
    { front: "Beautiful", back: "Güzel" },
    { front: "Strong", back: "Güçlü" },
    { front: "Happy", back: "Mutlu" },
  ],
  matematik: [
    { front: "2 × 3", back: "6" },
    { front: "7 + 8", back: "15" },
    { front: "√16", back: "4" },
    { front: "5²", back: "25" },
    { front: "12 ÷ 4", back: "3" },
    { front: "9 × 7", back: "63" },
    { front: "100 - 37", back: "63" },
    { front: "2³", back: "8" },
    { front: "√81", back: "9" },
    { front: "15 × 3", back: "45" },
    { front: "11²", back: "121" },
    { front: "144 ÷ 12", back: "12" },
    { front: "√49", back: "7" },
    { front: "3⁴", back: "81" },
    { front: "17 + 29", back: "46" },
  ],
  genel: [
    { front: "🇹🇷 Başkent", back: "Ankara" },
    { front: "🌍 En büyük okyanıs", back: "Pasifik" },
    { front: "🔬 H₂O", back: "Su" },
    { front: "🎵 7 nota", back: "Do Re Mi Fa Sol La Si" },
    { front: "📐 Üçgenin iç açıları", back: "180°" },
    { front: "🌞 Güneş sistemi merkezi", back: "Güneş" },
    { front: "🧪 Fe elementi", back: "Demir" },
    { front: "📖 İstiklal Marşı yazarı", back: "M. Akif Ersoy" },
    { front: "🌍 En büyük kıta", back: "Asya" },
    { front: "🔢 Pi sayısı", back: "3.14..." },
    { front: "🧬 DNA açılımı", back: "Deoksiribonükleik Asit" },
    { front: "⚛️ En hafif element", back: "Hidrojen" },
    { front: "🌙 Ay'a ilk adım", back: "1969" },
    { front: "📐 Pisagor", back: "a²+b²=c²" },
    { front: "🎨 Mona Lisa ressamı", back: "Da Vinci" },
  ],
};

const CATEGORY_LABELS: Record<Category, string> = {
  ingilizce: "İngilizce - Türkçe",
  matematik: "Matematik",
  genel: "Genel Kültür",
};

interface Card {
  id: number;
  pairId: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

type GameState = "menu" | "playing" | "finished";

function buildDeck(category: Category, pairCount: number): Card[] {
  const pool = [...CARD_POOLS[category]];
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, pairCount);

  const cards: Card[] = [];
  shuffled.forEach((pair, i) => {
    cards.push({ id: i * 2, pairId: i, content: pair.front, isFlipped: false, isMatched: false });
    cards.push({ id: i * 2 + 1, pairId: i, content: pair.back, isFlipped: false, isMatched: false });
  });

  return cards.sort(() => Math.random() - 0.5);
}

export default function MemoryMatchGame() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("Kolay");
  const [category, setCategory] = useState<Category>("ingilizce");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [pointsSubmitted, setPointsSubmitted] = useState(false);

  const isChecking = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalPairs = GRID_CONFIG[difficulty].pairs;

  const startGame = useCallback(() => {
    const deck = buildDeck(category, GRID_CONFIG[difficulty].pairs);
    setCards(deck);
    setFlippedIds([]);
    setMoves(0);
    setMatchedPairs(0);
    setTimer(0);
    setScore(0);
    setPointsSubmitted(false);
    isChecking.current = false;
    setGameState("playing");
  }, [category, difficulty]);

  useEffect(() => {
    if (gameState !== "playing") return;
    timerRef.current = setInterval(() => setTimer((prev) => prev + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing" && matchedPairs === totalPairs && totalPairs > 0) {
      if (timerRef.current) clearInterval(timerRef.current);

      const diffMult = CONFIG.DIFFICULTY_MULTIPLIER[difficulty];
      let pts = matchedPairs * Math.round(CONFIG.MATCH_POINTS * diffMult);

      const minMoves = totalPairs;
      if (moves <= minMoves * 1.5) pts += CONFIG.MIN_MOVES_BONUS;
      if (timer <= CONFIG.TIME_BONUS_THRESHOLD_SECONDS) pts += CONFIG.TIME_BONUS;
      if (moves === minMoves) pts += CONFIG.PERFECT_BONUS;

      setScore(pts);
      setGameState("finished");
    }
  }, [matchedPairs, totalPairs, gameState, difficulty, moves, timer]);

  useEffect(() => {
    if (gameState === "finished" && !pointsSubmitted && score > 0) {
      setPointsSubmitted(true);
      awardGamePoints(score, "memory-match").catch(() => toast.error("Puanlar kaydedilemedi"));
    }
  }, [gameState, pointsSubmitted, score]);

  const handleCardClick = (cardId: number) => {
    if (isChecking.current || gameState !== "playing") return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    if (flippedIds.includes(cardId)) return;

    const newFlipped = [...flippedIds, cardId];
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      isChecking.current = true;
      setMoves((prev) => prev + 1);

      const [firstId, secondId] = newFlipped;
      const first = cards.find((c) => c.id === firstId)!;
      const second = cards.find((c) => c.id === secondId)!;

      if (first.pairId === second.pairId) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.pairId === first.pairId ? { ...c, isMatched: true } : c
            )
          );
          setMatchedPairs((prev) => prev + 1);
          setFlippedIds([]);
          isChecking.current = false;
        }, 500);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIds([]);
          isChecking.current = false;
        }, 800);
      }
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

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
          <div className="mb-3"><Brain className="w-12 h-12 text-purple-500 mx-auto" /></div>
          <h1 className="text-2xl font-bold text-neutral-800">
            Hafıza Kartları
          </h1>
          <p className="text-neutral-500 mt-2">
            Eşleşen kartları bul, hafızanı test et!
          </p>
        </div>

        <div className="w-full space-y-2">
          <p className="text-sm font-semibold text-neutral-600">Kategori</p>
          {(Object.keys(CARD_POOLS) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                category === cat
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
              }`}
            >
              <span className="font-semibold">{CATEGORY_LABELS[cat]}</span>
            </button>
          ))}
        </div>

        <div className="w-full space-y-2">
          <p className="text-sm font-semibold text-neutral-600">Zorluk</p>
          {(["Kolay", "Orta", "Zor", "Uzman"] as Difficulty[]).map((d) => (
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
                ({GRID_CONFIG[d].pairs} çift)
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
        <div className="mb-2"><PartyPopper className="w-12 h-12 text-amber-500 mx-auto" /></div>
        <h1 className="text-2xl font-bold text-neutral-800">Tebrikler!</h1>

        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
            <Trophy className="h-6 w-6 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-600">{score}</p>
            <p className="text-xs text-purple-500">Toplam Puan</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
            <Clock className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">
              {formatTime(timer)}
            </p>
            <p className="text-xs text-green-500">Süre</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
            <MousePointer className="h-6 w-6 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-600">{moves}</p>
            <p className="text-xs text-purple-500">Hamle</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
            <RotateCcw className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">{matchedPairs}</p>
            <p className="text-xs text-amber-500">Eşleşme</p>
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

  const cols = GRID_CONFIG[difficulty].cols;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 py-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="text-neutral-600">
            <Clock className="h-4 w-4 inline mr-1" />
            {formatTime(timer)}
          </span>
          <span className="text-neutral-600">
            <MousePointer className="h-4 w-4 inline mr-1" />
            {moves}
          </span>
        </div>
        <span className="font-bold text-purple-600">
          {matchedPairs}/{totalPairs} çift
        </span>
      </div>

      {/* Progress */}
      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${(matchedPairs / totalPairs) * 100}%` }}
        />
      </div>

      {/* Cards grid */}
      <div
        className="w-full grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isFlipped || card.isMatched}
            className="relative aspect-[3/4] [perspective:600px]"
          >
            <div
              className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${
                card.isFlipped || card.isMatched ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* Back (hidden) */}
              <div className="absolute inset-0 rounded-xl bg-purple-500 border-2 border-purple-600 flex items-center justify-center [backface-visibility:hidden] cursor-pointer hover:bg-purple-400 active:scale-95 transition-colors">
                <span className="text-2xl text-white font-bold">?</span>
              </div>
              {/* Front (shown when flipped) */}
              <div
                className={`absolute inset-0 rounded-xl border-2 flex items-center justify-center p-1 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                  card.isMatched
                    ? "bg-green-50 border-green-400"
                    : "bg-white border-purple-300"
                }`}
              >
                <span className={`text-xs sm:text-sm font-semibold leading-tight ${
                  card.isMatched ? "text-green-600" : "text-neutral-800"
                }`}>
                  {card.content}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
