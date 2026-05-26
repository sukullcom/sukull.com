"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Gift, Loader2, Sparkles, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { joinPromotion } from "@/actions/promotions";
import { cn } from "@/lib/utils";
import type { ActivePromotion } from "@/lib/promotions";
import type { PromotionAccent } from "@/lib/promotion-accents";
import { clientLogger } from "@/lib/client-logger";

type Props = {
  promotion: ActivePromotion;
};

/**
 * Per-accent gradient tokens. Tailwind needs the literal class string to
 * appear in source so we cannot interpolate the colour into a single
 * `bg-gradient-to-br` template — the table below is the cheapest static map
 * that still keeps the JIT happy.
 */
const ACCENT_STYLES: Record<
  PromotionAccent,
  {
    surface: string;
    chip: string;
    ring: string;
    button: string;
    countdownText: string;
  }
> = {
  violet: {
    surface:
      "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,0.6)]",
    chip: "bg-white/15 text-white border border-white/25 backdrop-blur",
    ring: "ring-violet-300/60",
    button:
      "bg-white text-violet-700 hover:bg-white/95 active:bg-white/90 shadow-lg",
    countdownText: "text-white",
  },
  amber: {
    surface:
      "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-[0_10px_30px_-12px_rgba(217,119,6,0.6)]",
    chip: "bg-white/15 text-white border border-white/25 backdrop-blur",
    ring: "ring-amber-200/70",
    button: "bg-white text-orange-700 hover:bg-white/95 shadow-lg",
    countdownText: "text-white",
  },
  rose: {
    surface:
      "bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 text-white shadow-[0_10px_30px_-12px_rgba(244,63,94,0.6)]",
    chip: "bg-white/15 text-white border border-white/25 backdrop-blur",
    ring: "ring-rose-200/70",
    button: "bg-white text-rose-700 hover:bg-white/95 shadow-lg",
    countdownText: "text-white",
  },
  emerald: {
    surface:
      "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-[0_10px_30px_-12px_rgba(16,185,129,0.6)]",
    chip: "bg-white/15 text-white border border-white/25 backdrop-blur",
    ring: "ring-emerald-200/70",
    button: "bg-white text-emerald-700 hover:bg-white/95 shadow-lg",
    countdownText: "text-white",
  },
  sky: {
    surface:
      "bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-white shadow-[0_10px_30px_-12px_rgba(59,130,246,0.6)]",
    chip: "bg-white/15 text-white border border-white/25 backdrop-blur",
    ring: "ring-sky-200/70",
    button: "bg-white text-blue-700 hover:bg-white/95 shadow-lg",
    countdownText: "text-white",
  },
};

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeRemaining(target: number): CountdownParts | null {
  const diffMs = target - Date.now();
  if (diffMs <= 0) return null;
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function PromotionBanner({ promotion }: Props) {
  const accent = ACCENT_STYLES[promotion.accentColor] ?? ACCENT_STYLES.violet;

  const endsAtMs = useMemo(
    () => new Date(promotion.endsAt).getTime(),
    [promotion.endsAt],
  );

  const [remaining, setRemaining] = useState<CountdownParts | null>(() =>
    computeRemaining(endsAtMs),
  );

  /**
   * Optimistic mirror of the server state. We patch this on join to flip
   * the CTA immediately; the next server revalidate (post `revalidatePath`)
   * reconciles the canonical numbers.
   */
  const [joined, setJoined] = useState(promotion.joined);
  const [count, setCount] = useState(promotion.participantCount);
  const [winnerSelected, setWinnerSelected] = useState(promotion.winnerSelected);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setJoined(promotion.joined);
    setCount(promotion.participantCount);
    setWinnerSelected(promotion.winnerSelected);
  }, [promotion.joined, promotion.participantCount, promotion.winnerSelected]);

  useEffect(() => {
    if (!endsAtMs) return;
    const tick = () => setRemaining(computeRemaining(endsAtMs));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAtMs]);

  const handleJoin = useCallback(() => {
    if (joined || isPending || winnerSelected) return;
    setJoined(true);
    setCount((prev) => prev + 1);
    startTransition(async () => {
      try {
        const result = await joinPromotion(promotion.id);
        if (!result.ok) {
          // Roll back the optimistic update on a real failure. Already-joined
          // is not a failure — the server simply tells us the entry was
          // already there.
          setJoined(promotion.joined);
          setCount(promotion.participantCount);
          if (result.error === "not_live") {
            toast.error("Çekiliş sona erdi");
          } else if (result.error === "unauthenticated") {
            toast.error("Önce giriş yapmalısın");
          } else {
            toast.error("Katılım sırasında bir sorun oldu");
          }
          return;
        }
        if (typeof result.participantCount === "number") {
          setCount(result.participantCount);
        }
        if (result.alreadyJoined) {
          toast("Zaten çekilişe katılmıştın", { icon: "✓" });
        } else {
          toast.success("Çekilişe katıldın! Bol şans 🍀");
        }
      } catch (err) {
        setJoined(promotion.joined);
        setCount(promotion.participantCount);
        clientLogger.error({
          message: "joinPromotion client call failed",
          error: err,
          location: "promotion-banner/handleJoin",
        });
        toast.error("Bağlantı sorunu oluştu");
      }
    });
  }, [
    isPending,
    joined,
    promotion.id,
    promotion.joined,
    promotion.participantCount,
    winnerSelected,
  ]);

  if (!remaining) {
    // Countdown reached zero on the client: hide the banner so the page
    // doesn't carry a stale "0 saniye" forever. The server will drop the
    // promo on the next request anyway.
    return null;
  }

  return (
    <section
      aria-label={`Çekiliş: ${promotion.title}`}
      className={cn(
        "relative overflow-hidden rounded-2xl px-4 py-4 ring-1",
        accent.surface,
        accent.ring,
      )}
    >
      {/* Sparkle accents */}
      <Sparkles
        aria-hidden
        className="pointer-events-none absolute -top-2 -right-2 h-16 w-16 opacity-30"
      />
      <Sparkles
        aria-hidden
        className="pointer-events-none absolute -bottom-3 -left-3 h-12 w-12 opacity-20"
      />

      <div className="relative flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                accent.chip,
              )}
            >
              <Gift className="h-3 w-3" />
              {promotion.kind === "giveaway" ? "Çekiliş" : promotion.kind}
            </span>
            <h3 className="text-base font-extrabold leading-tight">
              {promotion.title}
            </h3>
          </div>
          {promotion.imageUrl ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-2 ring-white/30">
              <Image
                src={promotion.imageUrl}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          ) : (
            <Trophy aria-hidden className="h-6 w-6 shrink-0 opacity-90" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              accent.chip,
            )}
          >
            <Gift className="h-3.5 w-3.5" />
            Ödül: {promotion.prize}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              accent.chip,
            )}
            aria-live="polite"
          >
            <Users className="h-3.5 w-3.5" />
            {count.toLocaleString("tr-TR")} katılımcı
          </span>
        </div>

        {promotion.description && (
          <p className="text-sm/relaxed opacity-95">
            {promotion.description}
          </p>
        )}

        <CountdownStrip parts={remaining} chipClass={accent.chip} />

        {winnerSelected ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
              accent.chip,
            )}
          >
            <Trophy className="h-4 w-4" />
            Kazanan açıklandı — sonuçlar duyuruldu.
          </div>
        ) : joined ? (
          <Button
            type="button"
            disabled
            className={cn(
              "h-11 w-full justify-center gap-2 font-bold",
              accent.button,
              "cursor-default opacity-95",
            )}
          >
            <CheckCircle2 className="h-5 w-5" />
            Katıldın
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleJoin}
            disabled={isPending}
            className={cn(
              "h-11 w-full justify-center gap-2 font-bold",
              accent.button,
            )}
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Gift className="h-5 w-5" />
            )}
            {promotion.ctaLabel || "Çekilişe Katıl"}
          </Button>
        )}

        {promotion.rules && (
          <details className="text-xs opacity-90">
            <summary className="cursor-pointer select-none font-semibold">
              Çekiliş kuralları
            </summary>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed">
              {promotion.rules}
            </p>
          </details>
        )}
      </div>
    </section>
  );
}

function CountdownStrip({
  parts,
  chipClass,
}: {
  parts: CountdownParts;
  chipClass: string;
}) {
  const cells: Array<{ label: string; value: number; pad?: boolean }> = [
    { label: "gün", value: parts.days },
    { label: "saat", value: parts.hours, pad: true },
    { label: "dk", value: parts.minutes, pad: true },
    { label: "sn", value: parts.seconds, pad: true },
  ];
  return (
    <div
      className="grid grid-cols-4 gap-2"
      role="timer"
      aria-label="Çekiliş geri sayımı"
    >
      {cells.map(({ label, value, pad: padded }) => (
        <div
          key={label}
          className={cn(
            "flex flex-col items-center rounded-xl px-2 py-2 text-center",
            chipClass,
          )}
        >
          <span className="font-mono text-xl font-extrabold leading-none tabular-nums">
            {padded ? pad(value) : value}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wider opacity-80">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
