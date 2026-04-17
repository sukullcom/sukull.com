"use client";

import { useEffect, useState, useCallback } from "react";
import { getTodayChallenge, claimChallengeReward } from "@/actions/daily-challenges";
import { getTimeBonusInfo, type TimeBonusInfo } from "@/lib/time-bonus";
import { toast } from "sonner";
import { Trophy, Gift, CheckCircle, Clock, Loader2 } from "lucide-react";
import Confetti from "react-confetti";

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
      console.error("Error loading daily challenge:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChallenge();
    setTimeBonus(getTimeBonusInfo());

    const interval = setInterval(() => {
      loadChallenge();
      setTimeBonus(getTimeBonusInfo());
    }, 15000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadChallenge();
        setTimeBonus(getTimeBonusInfo());
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
      }
    } catch {
      toast.error("Ödül alınamadı");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl">
        <div className="animate-pulse">
          <div className="h-4 bg-amber-200/50 rounded mb-2 w-2/3"></div>
          <div className="h-3 bg-amber-200/50 rounded mb-3 w-full"></div>
          <div className="h-2 bg-amber-200/50 rounded w-full"></div>
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
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 rounded-xl">
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
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-gray-800">Günün Görevi</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {timeBonus?.label && (
              <span className="text-[10px] font-semibold bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full">
                {timeBonus.label}
              </span>
            )}
            <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              {dayName}
            </span>
          </div>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-1">
          {challenge.title}
        </p>
        <p className="text-xs text-gray-500 mb-3">{challenge.description}</p>

        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>
              {challenge.progress} / {challenge.target} {challenge.unit}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                challenge.completed ? "bg-green-500" : "bg-amber-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {challenge.completed && !challenge.rewardClaimed ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-60"
          >
            {claiming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Gift className="w-4 h-4" />
            )}
            Ödülü Al (+{challenge.bonusPoints} puan)
          </button>
        ) : (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Bonus: +{challenge.bonusPoints} puan</span>
          </div>
        )}
      </div>
    </>
  );
}
