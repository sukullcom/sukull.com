export type TimeBonusInfo = {
  multiplier: number;
  label: string | null;
  slot: "early_bird" | "morning" | "normal";
};

const TURKEY_UTC_OFFSET = 3;

function getTurkeyHour(): number {
  const now = new Date();
  const utcHour = now.getUTCHours();
  return (utcHour + TURKEY_UTC_OFFSET) % 24;
}

export function getTimeBonusInfo(): TimeBonusInfo {
  const hour = getTurkeyHour();

  if (hour >= 6 && hour < 8) {
    return { multiplier: 1.5, label: "Erken Kuş x1.5", slot: "early_bird" };
  }
  if (hour >= 8 && hour < 10) {
    return { multiplier: 1.25, label: "Sabah Bonusu x1.25", slot: "morning" };
  }
  return { multiplier: 1.0, label: null, slot: "normal" };
}

export function applyTimeBonus(basePoints: number): {
  total: number;
  bonus: number;
  multiplier: number;
} {
  const { multiplier } = getTimeBonusInfo();
  const total = Math.round(basePoints * multiplier);
  return { total, bonus: total - basePoints, multiplier };
}
