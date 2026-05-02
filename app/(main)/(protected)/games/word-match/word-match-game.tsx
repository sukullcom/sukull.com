"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Languages, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SCORING_SYSTEM } from "@/constants";
import { awardGamePoints } from "@/lib/client-points";
import { cn } from "@/lib/utils";
import { WORD_PAIRS, type WordPair } from "./word-pairs";

type Difficulty = "Kolay" | "Orta" | "Zor" | "Uzman";
type GamePhase = "menu" | "playing" | "finished";

const CONFIG = SCORING_SYSTEM.GAMES.WORD_MATCH;

const PAIRS_VISIBLE: Record<Difficulty, number> = {
  Kolay: 3,
  Orta: 4,
  Zor: 5,
  Uzman: 6,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Slot = {
  id: string;
  pairId: string;
  text: string;
  /** Doğru eşlendi; ikinci eşleşmeyi bekliyor veya toplu yenileme öncesi */
  cleared?: boolean;
};

type PendingCoord = { li: number; ri: number };

function clearedSlot(): Slot {
  return {
    id: newPairId(),
    pairId: "",
    text: "✓",
    cleared: true,
  };
}

/** İki bekleyen çifti yeni kelimelerle doldurur; sağ sütunda satır karıştırması olabilir. */
function fillTwoPendingSlots(
  L: Slot[],
  R: Slot[],
  coords: [PendingCoord, PendingCoord],
  pullPair: () => WordPair,
) {
  const [{ li: l0, ri: r0 }, { li: l1, ri: r1 }] = coords;
  const p0 = pullPair();
  const p1 = pullPair();
  const pid0 = newPairId();
  const pid1 = newPairId();
  L[l0] = {
    id: newPairId(),
    pairId: pid0,
    text: p0.tr,
    cleared: false,
  };
  L[l1] = {
    id: newPairId(),
    pairId: pid1,
    text: p1.tr,
    cleared: false,
  };
  if (Math.random() < 0.5) {
    R[r0] = {
      id: newPairId(),
      pairId: pid0,
      text: p0.en,
      cleared: false,
    };
    R[r1] = {
      id: newPairId(),
      pairId: pid1,
      text: p1.en,
      cleared: false,
    };
  } else {
    R[r0] = {
      id: newPairId(),
      pairId: pid1,
      text: p1.en,
      cleared: false,
    };
    R[r1] = {
      id: newPairId(),
      pairId: pid0,
      text: p0.en,
      cleared: false,
    };
  }
}

function fillOnePendingSlot(
  L: Slot[],
  R: Slot[],
  coord: PendingCoord,
  pullPair: () => WordPair,
) {
  const { li, ri } = coord;
  const p = pullPair();
  const pid = newPairId();
  L[li] = {
    id: newPairId(),
    pairId: pid,
    text: p.tr,
    cleared: false,
  };
  R[ri] = {
    id: newPairId(),
    pairId: pid,
    text: p.en,
    cleared: false,
  };
}

function newPairId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildColumns(
  count: number,
  deck: WordPair[],
): { left: Slot[]; right: Slot[]; deckRest: WordPair[] } {
  const rest = [...deck];
  const taken: WordPair[] = [];
  for (let i = 0; i < count && rest.length > 0; i++) {
    taken.push(rest.shift()!);
  }
  const left: Slot[] = taken.map((p) => ({
    id: newPairId(),
    pairId: newPairId(),
    text: p.tr,
  }));
  const right: Slot[] = taken.map((p, i) => ({
    id: newPairId(),
    pairId: left[i]!.pairId,
    text: p.en,
  }));
  const li = shuffle(left.map((_, i) => i));
  const ri = shuffle(right.map((_, i) => i));
  return {
    left: li.map((i) => left[i]!),
    right: ri.map((i) => right[i]!),
    deckRest: rest,
  };
}

export default function WordMatchGame() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("Kolay");
  const [left, setLeft] = useState<Slot[]>([]);
  const [right, setRight] = useState<Slot[]>([]);
  const deckRef = useRef<WordPair[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number>(
    CONFIG.GAME_DURATION_SECONDS,
  );
  const [score, setScore] = useState(0);
  const [matches, setMatches] = useState(0);
  const [selection, setSelection] = useState<
    { side: "L" | "R"; index: number } | null
  >(null);
  const [pointsSubmitted, setPointsSubmitted] = useState(false);
  const pendingBatchRef = useRef<PendingCoord[]>([]);
  const latestBoardRef = useRef<{ left: Slot[]; right: Slot[] }>({
    left: [],
    right: [],
  });

  const diffMult = CONFIG.DIFFICULTY_MULTIPLIER[difficulty] ?? 1;

  const refillDeck = useCallback(() => {
    deckRef.current = shuffle([...WORD_PAIRS]);
  }, []);

  const startGame = useCallback(() => {
    refillDeck();
    const n = PAIRS_VISIBLE[difficulty];
    const { left: L, right: R, deckRest } = buildColumns(n, deckRef.current);
    deckRef.current = deckRest;
    pendingBatchRef.current = [];
    setLeft(L);
    setRight(R);
    setScore(0);
    setMatches(0);
    setSecondsLeft(CONFIG.GAME_DURATION_SECONDS);
    setSelection(null);
    setPointsSubmitted(false);
    setPhase("playing");
  }, [difficulty, refillDeck]);

  const pullPair = useCallback((): WordPair => {
    if (deckRef.current.length === 0) refillDeck();
    return deckRef.current.shift()!;
  }, [refillDeck]);

  useEffect(() => {
    if (phase !== "playing") return;
    const t = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    latestBoardRef.current = { left, right };
  }, [left, right]);

  useEffect(() => {
    if (phase !== "playing" || secondsLeft !== 0) return;

    const pend = pendingBatchRef.current;
    if (pend.length === 1) {
      const L = [...latestBoardRef.current.left];
      const R = [...latestBoardRef.current.right];
      fillOnePendingSlot(L, R, pend[0]!, pullPair);
      pendingBatchRef.current = [];
      setLeft(L);
      setRight(R);
    }

    setPhase("finished");
  }, [phase, secondsLeft, pullPair]);

  useEffect(() => {
    if (phase !== "finished" || pointsSubmitted || score <= 0) return;
    setPointsSubmitted(true);
    awardGamePoints(score, "word-match").catch(() =>
      toast.error("Puanlar kaydedilemedi"),
    );
  }, [phase, pointsSubmitted, score]);

  const handleCellClick = (side: "L" | "R", index: number) => {
    if (phase !== "playing" || secondsLeft <= 0) return;

    const slot = side === "L" ? left[index] : right[index];
    if (slot?.cleared) return;

    if (!selection) {
      setSelection({ side, index });
      return;
    }
    if (selection.side === side) {
      setSelection({ side, index });
      return;
    }

    const L = [...left];
    const R = [...right];
    const li = selection.side === "L" ? selection.index : index;
    const ri = selection.side === "R" ? selection.index : index;
    const leftSlot = L[li];
    const rightSlot = R[ri];
    if (!leftSlot || !rightSlot) {
      setSelection(null);
      return;
    }
    if (leftSlot.cleared || rightSlot.cleared) {
      setSelection(null);
      return;
    }

    if (leftSlot.pairId === rightSlot.pairId) {
      L[li] = clearedSlot();
      R[ri] = clearedSlot();
      pendingBatchRef.current.push({ li, ri });
      const pts = Math.round(CONFIG.POINTS_PER_MATCH * diffMult);
      setScore((p) => p + pts);
      setMatches((m) => m + 1);

      if (pendingBatchRef.current.length >= 2) {
        const [a, b] = pendingBatchRef.current as [PendingCoord, PendingCoord];
        pendingBatchRef.current = [];
        fillTwoPendingSlots(L, R, [a, b], pullPair);
      }

      setLeft(L);
      setRight(R);
      setSelection(null);
      return;
    }

    toast.error("Yanlış eşleşme!", {
      className: "border-suk-danger/40 bg-suk-danger-soft text-suk-danger",
    });
    setSelection(null);
  };

  const cellClass = (active: boolean, cleared?: boolean) =>
    cn(
      "min-h-[52px] rounded-xl border-2 px-3 py-2 text-center text-sm font-medium transition-all sm:min-h-[56px] sm:text-base",
      cleared
        ? "cursor-default border-suk-brand/40 bg-suk-brand-soft text-suk-brand-soft-fg"
        : "border-border bg-card text-foreground hover:border-border/80 hover:bg-muted active:scale-[0.98]",
      active &&
        !cleared &&
        "border-suk-payment bg-suk-payment-soft ring-2 ring-suk-payment-ring",
    );

  if (phase === "menu") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-8">
        <Link
          prefetch={false}
          href="/games"
          className="self-start flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Oyunlara Dön
        </Link>

        <div className="text-center">
          <div className="mb-3">
            <Languages className="mx-auto h-12 w-12 text-suk-play" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Kelime Eşleştirme
          </h1>
          <p className="mt-2 text-muted-foreground">
            Solda Türkçe, sağda İngilizce. İlk doğru eşleşmede kutular onaylanır;{" "}
            <strong className="text-foreground">ikinci</strong> doğru
            eşleşmeden sonra iki çift birden yenilenir.{" "}
            {CONFIG.GAME_DURATION_SECONDS} saniyede olabildiğince çift tamamla.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Doğru eşleşme: +{CONFIG.POINTS_PER_MATCH} × zorluk çarpanı puan ·
            Yanlışta uyarı (puan düşmez).
          </p>
        </div>

        <div className="w-full space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Zorluk</p>
          {(["Kolay", "Orta", "Zor", "Uzman"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                difficulty === d
                  ? "border-suk-payment bg-suk-payment-soft text-suk-payment-soft-fg"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              <span className="font-semibold">{d}</span>
              <span className="ml-2 text-xs opacity-70">
                ({PAIRS_VISIBLE[d]} çift · ×{CONFIG.DIFFICULTY_MULTIPLIER[d]}{" "}
                puan)
              </span>
            </button>
          ))}
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

  if (phase === "finished") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-8">
        <div className="mb-2">
          <Trophy className="mx-auto h-12 w-12 text-suk-warning" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Süre Doldu!</h1>

        <div className="grid w-full grid-cols-2 gap-3">
          <div className="rounded-xl border border-suk-warning-border bg-suk-warning-soft p-4 text-center">
            <Trophy className="mx-auto mb-1 h-6 w-6 text-suk-warning" />
            <p className="text-2xl font-bold text-suk-warning-soft-fg">{score}</p>
            <p className="text-xs text-suk-warning">Toplam Puan</p>
          </div>
          <div className="rounded-xl border border-suk-brand/30 bg-suk-brand-soft p-4 text-center">
            <Languages className="mx-auto mb-1 h-6 w-6 text-suk-brand" />
            <p className="text-2xl font-bold text-suk-brand-soft-fg">{matches}</p>
            <p className="text-xs text-suk-brand">Doğru Eşleşme</p>
          </div>
          <div className="col-span-2 rounded-xl border border-suk-payment-ring bg-suk-payment-soft p-3 text-center">
            <p className="text-sm font-semibold text-suk-payment-soft-fg">{difficulty}</p>
            <p className="text-xs text-suk-payment">Zorluk</p>
          </div>
        </div>

        <div className="flex w-full gap-3">
          <Button
            variant="primary"
            onClick={startGame}
            className="flex-1 py-5"
          >
            Tekrar Oyna
          </Button>
          <Link prefetch={false} href="/games" className="flex-1">
            <Button variant="outline" className="w-full py-5">
              Oyunlara Dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const timerPct =
    (secondsLeft / CONFIG.GAME_DURATION_SECONDS) * 100;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 py-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-suk-warning" />
          <span className="text-lg font-bold text-suk-play-soft-fg">{score}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span
            className={`font-mono text-lg font-bold ${
              secondsLeft <= 10 ? "text-suk-danger" : "text-foreground"
            }`}
          >
            {secondsLeft}s
          </span>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            secondsLeft <= 10 ? "bg-suk-danger" : "bg-suk-play"
          }`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <div className="flex w-full justify-between text-xs font-medium text-muted-foreground sm:text-sm">
        <span>Türkçe</span>
        <span>İngilizce</span>
      </div>

      <div className="grid w-full grid-cols-2 gap-3 sm:gap-4">
        <div className="flex flex-col gap-2">
          {left.map((cell, i) => (
            <button
              key={cell.id}
              type="button"
              disabled={cell.cleared}
              className={cellClass(
                selection?.side === "L" && selection.index === i,
                cell.cleared,
              )}
              onClick={() => handleCellClick("L", i)}
            >
              {cell.text}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {right.map((cell, i) => (
            <button
              key={cell.id}
              type="button"
              disabled={cell.cleared}
              className={cellClass(
                selection?.side === "R" && selection.index === i,
                cell.cleared,
              )}
              onClick={() => handleCellClick("R", i)}
            >
              {cell.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
