"use client";

import { useEffect, useState, useCallback } from "react";
import { getCurrentDayProgress } from "@/actions/daily-streak";
import Image from "next/image";
import { RefreshCw, AlertCircle } from "lucide-react";

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
    // Initial load
    loadProgress();
    
    // Refresh progress every 15 seconds (reduced from 30 for more responsiveness)
    const interval = setInterval(() => loadProgress(), 15000);
    
    // Add visibility change listener to refresh when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProgress(true);
      }
    };

    const handleFocus = () => {
      loadProgress(true);
    };
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadProgress]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    loadProgress(true);
  }, [loadProgress]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl text-white">
        <div className="animate-pulse">
          <div className="h-4 bg-white/30 rounded mb-2"></div>
          <div className="h-6 bg-white/30 rounded mb-2"></div>
          <div className="h-4 bg-white/30 rounded"></div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    if (hasError) {
      return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm opacity-90">
              <AlertCircle className="h-4 w-4" />
              <span>İlerleme yüklenemedi</span>
            </div>
            <button
              onClick={() => loadProgress(true)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const { pointsEarnedToday, dailyTarget, achieved, currentStreak, progressPercentage } = progressData;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">Günlük İlerleme</h3>
        <div className="flex items-center gap-2">
          <Image
            src={achieved ? "/istikrar.svg" : "/istikrarsiz.svg"}
            alt={achieved ? "Hedef tutturuldu" : "Hedef tutturulmadı"}
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <span className="text-sm font-medium">
            {currentStreak} gün
          </span>
          {/* Manual refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            title="Yenile"
          >
            <RefreshCw 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>{pointsEarnedToday} / {dailyTarget} puan</span>
          <span>{Math.max(0, Math.round(progressPercentage))}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(0, Math.min(progressPercentage, 100))}%` }}
          ></div>
        </div>
      </div>

      <div className="text-sm opacity-90">
        {achieved ? (
          <div className="flex items-center gap-2">
            <span>🎉</span>
            <span>Günlük hedefe ulaştın!</span>
          </div>
        ) : (
          <span>
            Hedefe ulaşmak için {dailyTarget - pointsEarnedToday} puan daha kazanmalısın
          </span>
        )}
      </div>

      {currentStreak > 0 && (
        <div className="mt-3 text-sm bg-white/10 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <span>
              {currentStreak === 1
                ? "İlk gün! Devam et!"
                : `${currentStreak} gün üst üste hedefini tamamladın!`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 