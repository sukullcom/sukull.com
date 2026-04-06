"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SCORING_SYSTEM } from "@/constants";

type Props = {
  currentStreak: number;
  dailyGoalAchieved: boolean;
  pointsEarnedToday: number;
  dailyTarget: number;
};

const STREAK_MILESTONES = [
  { days: 60, bonus: SCORING_SYSTEM.STREAK_BONUSES.DAILY_STREAK_60, label: "60 gün" },
  { days: 30, bonus: SCORING_SYSTEM.STREAK_BONUSES.DAILY_STREAK_30, label: "30 gün" },
  { days: 15, bonus: SCORING_SYSTEM.STREAK_BONUSES.DAILY_STREAK_15, label: "15 gün" },
  { days: 7, bonus: SCORING_SYSTEM.STREAK_BONUSES.DAILY_STREAK_7, label: "7 gün" },
  { days: 3, bonus: SCORING_SYSTEM.STREAK_BONUSES.DAILY_STREAK_3, label: "3 gün" },
];

const UNLOCK_MILESTONES = [
  { days: 3, label: "Kullanıcı adı değiştirme" },
  { days: 7, label: "Günlük hedef belirleme ve çalışma arkadaşı" },
  { days: 14, label: "Avatar değiştirme ve okul seçimi" },
];

function getStoredMilestone(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("sukull_last_streak_milestone") || "0", 10);
}

function setStoredMilestone(days: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem("sukull_last_streak_milestone", String(days));
}

function getStoredGoalDate(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("sukull_last_goal_date") || "";
}

function setStoredGoalDate(date: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("sukull_last_goal_date", date);
}

export function CelebrationChecker({
  currentStreak,
  dailyGoalAchieved,
  pointsEarnedToday,
  dailyTarget,
}: Props) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const today = new Date().toISOString().split("T")[0];
    const lastShown = getStoredMilestone();
    const lastGoalDate = getStoredGoalDate();

    // Daily goal celebration
    if (dailyGoalAchieved && lastGoalDate !== today) {
      setStoredGoalDate(today);
      setTimeout(() => {
        toast.success(`Günlük hedefini tutturdun! (${pointsEarnedToday}/${dailyTarget} puan)`, {
          duration: 4000,
          icon: "🎯",
        });
      }, 500);
    }

    // Streak milestone celebration
    const milestone = STREAK_MILESTONES.find(
      (m) => currentStreak >= m.days && m.days > lastShown
    );
    if (milestone) {
      setStoredMilestone(milestone.days);
      setTimeout(() => {
        toast.success(
          `${milestone.label} istikrar! +${milestone.bonus} bonus puan kazandın!`,
          { duration: 6000, icon: "🔥" }
        );
      }, 1500);
    }

    // Feature unlock celebration
    const unlock = UNLOCK_MILESTONES.find(
      (u) => currentStreak >= u.days && u.days > lastShown
    );
    if (unlock) {
      setTimeout(() => {
        toast.success(`Yeni özellik açıldı: ${unlock.label}!`, {
          duration: 5000,
          icon: "🔓",
        });
      }, 3000);
    }
  }, [currentStreak, dailyGoalAchieved, pointsEarnedToday, dailyTarget]);

  return null;
}
