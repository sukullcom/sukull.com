"use client";

import { useEffect, useState, useCallback } from "react";
import { getCurrentDayProgress } from "@/actions/daily-streak";
import { getTimeBonusInfo, getRemainingHoursInDay, type TimeBonusInfo } from "@/lib/time-bonus";
import Image from "next/image";
import { RefreshCw, AlertCircle, Sparkles, Flame, Sunrise, Clock } from "lucide-react";

interface DailyProgressData {
  pointsEarnedToday: number;
  dailyTarget: number;
  achieved: boolean;
  currentStreak: number;
  progressPercentage: number;
}

export function DailyProgress() {
  const [progressData, setProgressData] = useState<DailyProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeBonus, setTimeBonus] = useState<TimeBonusInfo | null>(null);
  const [remainingHours, setRemainingHours] = useState<number | null>(null);

  const loadProgress = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }
      const data = await getCurrentDayProgress();
      setProgressData(data);
      setHasError(false);
    } catch (error) {
      console.error("Error loading daily progress:", error);
      setHasError(true);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  useEffect(() => {
    loadProgress();
    setTimeBonus(getTimeBonusInfo());
    setRemainingHours(getRemainingHoursInDay());
    
    const interval = setInterval(() => {
      loadProgress();
      setTimeBonus(getTimeBonusInfo());
      setRemainingHours(getRemainingHoursInDay());
    }, 15000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProgress(true);
      }
    };

    const handleFocus = () => {
      loadProgress(true);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadProgress]);

  const handleManualRefresh = useCallback(() => {
    loadProgress(true);
  }, [loadProgress]);

  if (loading) {
    return (
      <div className="border-2 border-gray-200 rounded-2xl p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    if (hasError) {
      return (
        <div className="border-2 border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4" />
              <span>İlerleme yüklenemedi</span>
            </div>
            <button
              onClick={() => loadProgress(true)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const { pointsEarnedToday, dailyTarget, achieved, currentStreak, progressPercentage } = progressData;

  return (
    <div className="border-2 border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-700">Günlük İlerleme</h3>
        <div className="flex items-center gap-2">
          <Image
            src={achieved ? "/istikrar.svg" : "/istikrarsiz.svg"}
            alt={achieved ? "Hedef tutturuldu" : "Hedef tutturulmadı"}
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <span className="text-sm font-medium text-gray-600">
            {currentStreak} gün
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="ml-1 p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Yenile"
          >
            <RefreshCw 
              className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1 text-gray-500">
          <span>{pointsEarnedToday} / {dailyTarget} puan</span>
          <span>{Math.max(0, Math.round(progressPercentage))}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ease-out ${achieved ? "bg-green-500" : "bg-blue-500"}`}
            style={{ width: `${Math.max(0, Math.min(progressPercentage, 100))}%` }}
          ></div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        {achieved ? (
          <div className="flex items-center gap-2 text-green-600">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="font-medium">Günlük hedefe ulaştın!</span>
          </div>
        ) : (
          <span>
            Hedefe ulaşmak için {dailyTarget - pointsEarnedToday} puan daha kazanmalısın
          </span>
        )}
      </div>

      {currentStreak > 0 && (
        <div className="mt-3 text-sm bg-gray-50 rounded-xl p-2.5">
          <div className="flex items-center gap-2 text-gray-600">
            <Flame className="w-4 h-4 shrink-0 text-orange-500" />
            <span>
              {currentStreak === 1
                ? "İlk gün! Devam et!"
                : `${currentStreak} gün üst üste hedefini tamamladın!`}
            </span>
          </div>
        </div>
      )}

      {timeBonus?.label && (
        <div className="mt-2 text-sm bg-yellow-50 rounded-xl p-2.5">
          <div className="flex items-center gap-2 text-yellow-700">
            <Sunrise className="w-4 h-4 shrink-0" />
            <span className="font-medium">{timeBonus.label} aktif</span>
          </div>
        </div>
      )}

      {remainingHours !== null && (
        <div className="mt-2 text-sm bg-gray-50 rounded-xl p-2.5">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Kalan: {remainingHours} saat</span>
          </div>
        </div>
      )}
    </div>
  );
}
