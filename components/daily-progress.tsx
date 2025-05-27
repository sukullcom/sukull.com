"use client";

import { useEffect, useState } from "react";
import { getCurrentDayProgress } from "@/actions/daily-streak";
import Image from "next/image";

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

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await getCurrentDayProgress();
        setProgressData(data);
      } catch (error) {
        console.error("Error loading daily progress:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
    
    // Refresh progress every 30 seconds
    const interval = setInterval(loadProgress, 30000);
    return () => clearInterval(interval);
  }, []);

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
            alt={achieved ? "Goal achieved" : "Goal not achieved"}
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <span className="text-sm font-medium">
            {currentStreak} gün
          </span>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>{pointsEarnedToday} / {dailyTarget} puan</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
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