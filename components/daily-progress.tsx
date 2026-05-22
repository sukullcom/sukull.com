"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getCurrentDayProgress } from "@/actions/daily-streak";
import { getTimeBonusInfo, getRemainingHoursInDay, type TimeBonusInfo } from "@/lib/time-bonus";
import { PROGRESS_UPDATED_EVENT } from "@/lib/progress-events";
import Image from "next/image";
import { RefreshCw, AlertCircle, Sparkles, Flame, Sunrise, Clock } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";
import {
  isDocumentVisible,
  isTransientNetworkError,
} from "@/lib/is-transient-network-error";

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

  /**
   * Unmount sonrası state update etmemek için "alive" referansı. Component
   * sayfası ekrandan kalkmış olsa bile in-flight server action gelmeye
   * devam edebilir; o anda `setHasError(true)` ya da `setProgressData(...)`
   * yapmak React'tan uyarı toplar ve içerikte yanıp sönen "hata kutusu"
   * etkisi yaratır.
   */
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const loadProgress = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }
      const data = await getCurrentDayProgress();
      if (!aliveRef.current) return;
      setProgressData(data);
      setHasError(false);
    } catch (error) {
      // Geçici ağ gürültüsünü (Failed to fetch / AbortError / offline /
      // bfcache navigasyonu) error_log'a yazma. Bu mesaj genellikle
      // kullanıcı sayfayı değiştirirken in-flight server action'ın iptali
      // ile gelir; gerçek bir bug değildir.
      const transient = isTransientNetworkError(error);
      if (transient) {
        clientLogger.warn("daily-progress fetch aborted by browser", {
          location: "daily-progress",
          reason:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : { raw: String(error) },
        });
        // Doküman gizli/unloading ise UI'ı hata moduna çevirmeyelim;
        // kullanıcı zaten ayrılıyor ya da sekme arka planda. Sayfaya
        // dönünce visibilitychange tekrar tetiklenip taze veri çekecek.
        if (aliveRef.current && isDocumentVisible()) {
          setHasError(true);
        }
      } else {
        clientLogger.error({
          message: "load daily progress failed",
          error,
          location: "daily-progress",
        });
        if (aliveRef.current) setHasError(true);
      }
    } finally {
      if (aliveRef.current) setLoading(false);
      if (showRefreshIndicator) {
        setTimeout(() => {
          if (aliveRef.current) setIsRefreshing(false);
        }, 500);
      }
    }
  }, []);

  useEffect(() => {
    loadProgress();
    setTimeBonus(getTimeBonusInfo());
    setRemainingHours(getRemainingHoursInDay());

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProgress(true);
        setTimeBonus(getTimeBonusInfo());
        setRemainingHours(getRemainingHoursInDay());
      }
    };

    const handleFocus = () => {
      loadProgress(true);
      setTimeBonus(getTimeBonusInfo());
      setRemainingHours(getRemainingHoursInDay());
    };

    const handleProgressUpdated = () => {
      loadProgress(true);
      setTimeBonus(getTimeBonusInfo());
      setRemainingHours(getRemainingHoursInDay());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener(PROGRESS_UPDATED_EVENT, handleProgressUpdated);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener(PROGRESS_UPDATED_EVENT, handleProgressUpdated);
    };
  }, [loadProgress]);

  const handleManualRefresh = useCallback(() => {
    loadProgress(true);
  }, [loadProgress]);

  if (loading) {
    return (
      <div className="border-2 border-border rounded-2xl p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-6 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    if (hasError) {
      return (
        <div className="border-2 border-border rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>İlerleme yüklenemedi</span>
            </div>
            <button
              onClick={() => loadProgress(true)}
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const { pointsEarnedToday, dailyTarget, achieved, currentStreak, progressPercentage } = progressData;
  const overTarget = dailyTarget > 0 && pointsEarnedToday > dailyTarget;
  const targetPercentOfGoal =
    dailyTarget > 0
      ? Math.max(0, Math.round((pointsEarnedToday / dailyTarget) * 100))
      : 0;

  return (
    <div className="border-2 border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-foreground">Günlük İlerleme</h3>
        <div className="flex items-center gap-2">
          <Image
            src={achieved ? "/istikrar.svg" : "/istikrarsiz.svg"}
            alt={achieved ? "Hedef tutturuldu" : "Hedef tutturulmadı"}
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <span className="text-sm font-medium text-muted-foreground">
            {currentStreak} gün
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="ml-1 p-1 hover:bg-muted rounded-full transition-colors"
            title="Yenile"
          >
            <RefreshCw 
              className={`w-4 h-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1 text-muted-foreground">
          <span>
            {pointsEarnedToday} / {dailyTarget} puan
            {achieved && (
              <span className="sr-only">(günlük puan hedefi tamamlandı)</span>
            )}
          </span>
          <span
            className={overTarget ? "text-suk-brand font-medium" : undefined}
            title="Günlük hedefe göre yüzde"
          >
            {targetPercentOfGoal}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ease-out ${achieved ? "bg-suk-brand" : "bg-suk-payment"}`}
            style={{ width: `${Math.max(0, Math.min(achieved ? 100 : progressPercentage, 100))}%` }}
          ></div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {achieved ? (
          <div className="flex items-center gap-2 text-suk-brand">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              {overTarget
                ? `Bugünkü toplam ${pointsEarnedToday} puan; günlük hedef (${dailyTarget}) aşıldı!`
                : "Günlük hedefe ulaştın!"}
            </span>
          </div>
        ) : (
          <span>
            Hedefe ulaşmak için{" "}
            {Math.max(0, dailyTarget - pointsEarnedToday)} puan daha kazanmalısın
          </span>
        )}
      </div>

      {currentStreak > 0 && (
        <div className="mt-3 text-sm bg-muted rounded-xl p-2.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="w-4 h-4 shrink-0 text-suk-warning" />
            <span>
              {currentStreak === 1
                ? "İlk gün! Devam et!"
                : `${currentStreak} gün üst üste hedefini tamamladın!`}
            </span>
          </div>
        </div>
      )}

      {timeBonus?.label && (
        <div className="mt-2 text-sm bg-suk-warning-soft rounded-xl p-2.5 border border-suk-warning-border">
          <div className="flex items-center gap-2 text-suk-warning-soft-fg">
            <Sunrise className="w-4 h-4 shrink-0" />
            <span className="font-medium">{timeBonus.label} aktif</span>
          </div>
        </div>
      )}

      {remainingHours !== null && (
        <div className="mt-2 text-sm bg-muted rounded-xl p-2.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Kalan: {remainingHours} saat</span>
          </div>
        </div>
      )}
    </div>
  );
}
