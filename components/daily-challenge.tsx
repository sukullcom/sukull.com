"use client";

import { useEffect, useState, useCallback } from "react";
import { getTodayChallenge, claimChallengeReward } from "@/actions/daily-challenges";
import { getTimeBonusInfo, type TimeBonusInfo } from "@/lib/time-bonus";
import {
  CHALLENGE_UPDATED_EVENT,
  PROGRESS_UPDATED_EVENT,
  emitProgressUpdated,
} from "@/lib/progress-events";
import { toast } from "sonner";
import { Trophy, Gift, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Confetti from "@/components/lazy-confetti";
import { clientLogger } from "@/lib/client-logger";

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

interface ChallengeData {
  id: string;
  title: string;
  description: string;
  target: number;
  bonusPoints: number;
  unit: string;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
  dayIndex: number;
  date: string;
}

export function DailyChallenge() {
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeBonus, setTimeBonus] = useState<TimeBonusInfo | null>(null);

  const loadChallenge = useCallback(async () => {
    try {
      const data = await getTodayChallenge();
      setChallenge(data as ChallengeData | null);
    } catch (error) {
      clientLogger.error({ message: "load daily challenge failed", error, location: "daily-challenge" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChallenge();
    setTimeBonus(getTimeBonusInfo());

    /**
     * Event-driven refresh (no setInterval). The 60s safety-net was dropped
     * for cost: widget is present on every protected layout; at 10K MAU
     * that was ~10K needless requests/min. Events below cover the real
     * update surface (lesson/game/shop completions + tab focus).
     */
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadChallenge();
        setTimeBonus(getTimeBonusInfo());
      }
    };

    const handleUpdated = () => {
      loadChallenge();
      setTimeBonus(getTimeBonusInfo());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(CHALLENGE_UPDATED_EVENT, handleUpdated);
    window.addEventListener(PROGRESS_UPDATED_EVENT, handleUpdated);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(CHALLENGE_UPDATED_EVENT, handleUpdated);
      window.removeEventListener(PROGRESS_UPDATED_EVENT, handleUpdated);
    };
  }, [loadChallenge]);

  const handleClaim = async () => {
    if (!challenge || claiming) return;
    setClaiming(true);
    try {
      const result = await claimChallengeReward();
      if (result.success) {
        setShowConfetti(true);
        toast.success(`Tebrikler! +${result.bonusPoints} bonus puan kazandın!`);
        setTimeout(() => setShowConfetti(false), 4000);
        await loadChallenge();
        emitProgressUpdated({ source: "challenge-claim", bonusPoints: result.bonusPoints });
      }
    } catch {
      toast.error("Ödül alınamadı");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-border p-4">
        <div className="animate-pulse">
          <div className="mb-2 h-4 w-2/3 rounded bg-muted"></div>
          <div className="mb-3 h-3 w-full rounded bg-muted"></div>
          <div className="h-2 w-full rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  const progressPercent = Math.min(
    (challenge.progress / challenge.target) * 100,
    100,
  );
  const dayName = DAY_NAMES[challenge.dayIndex] ?? "";

  if (challenge.rewardClaimed) {
    return (
      <div className="border-2 border-green-400 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-sm">Günün Görevi Tamamlandı!</span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          +{challenge.bonusPoints} bonus puan kazandın
        </p>
      </div>
    );
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 9999 }}
        />
      )}
      <div className="rounded-2xl border-2 border-border p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-suk-warning" />
            <h3 className="text-sm font-bold text-foreground">Günün Görevi</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {timeBonus?.label && (
              <span className="rounded-full border border-suk-warning-border bg-suk-warning-soft px-1.5 py-0.5 text-[10px] font-semibold text-suk-warning-soft-fg">
                {timeBonus.label}
              </span>
            )}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {dayName}
            </span>
          </div>
        </div>

        <p className="mb-1 text-sm font-semibold text-foreground">
          {challenge.title}
        </p>
        <p className="mb-3 text-xs text-muted-foreground">{challenge.description}</p>

        <div className="mb-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>
              {challenge.progress} / {challenge.target} {challenge.unit}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                challenge.completed ? "bg-suk-brand" : "bg-suk-warning"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {challenge.completed && !challenge.rewardClaimed ? (
          <Button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            variant="primary"
            size="default"
            className="w-full mt-2 gap-2"
          >
            {claiming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Gift className="w-4 h-4" />
            )}
            Ödülü Al (+{challenge.bonusPoints} puan)
          </Button>
        ) : (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Bonus: +{challenge.bonusPoints} puan</span>
          </div>
        )}
      </div>
    </>
  );
}
