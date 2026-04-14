"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { School } from "lucide-react";

type PodiumEntry = {
  id: string | number;
  name: string;
  points: number;
  imageSrc?: string;
};

type PodiumProps = {
  entries: PodiumEntry[];
  variant: "user" | "school";
};

const MEDAL_STYLES = [
  {
    ring: "ring-amber-400",
    bg: "bg-gradient-to-b from-amber-50 to-amber-100",
    text: "text-amber-600",
    badge: "bg-amber-400 text-white",
    height: "h-32 sm:h-36",
    size: "h-16 w-16 sm:h-20 sm:w-20",
    label: "1.",
    order: "order-2",
  },
  {
    ring: "ring-gray-300",
    bg: "bg-gradient-to-b from-gray-50 to-gray-100",
    text: "text-gray-500",
    badge: "bg-gray-400 text-white",
    height: "h-24 sm:h-28",
    size: "h-12 w-12 sm:h-16 sm:w-16",
    label: "2.",
    order: "order-1",
  },
  {
    ring: "ring-orange-300",
    bg: "bg-gradient-to-b from-orange-50 to-orange-100",
    text: "text-orange-600",
    badge: "bg-orange-400 text-white",
    height: "h-20 sm:h-24",
    size: "h-12 w-12 sm:h-16 sm:w-16",
    label: "3.",
    order: "order-3",
  },
];

export const Podium = ({ entries, variant }: PodiumProps) => {
  if (entries.length === 0) return null;

  const top3 = entries.slice(0, 3);

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4 w-full max-w-lg mx-auto mb-6 px-2">
      {top3.map((entry, i) => {
        const style = MEDAL_STYLES[i];
        return (
          <div
            key={entry.id}
            className={cn(
              "flex flex-col items-center",
              style.order,
              "animate-in fade-in slide-in-from-bottom-4 duration-500",
            )}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="relative mb-2">
              <span
                className={cn(
                  "absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow",
                  style.badge,
                )}
              >
                {style.label}
              </span>
              {variant === "user" ? (
                <Avatar
                  className={cn(
                    "ring-4 shadow-lg",
                    style.ring,
                    style.size,
                  )}
                >
                  <AvatarImage
                    src={entry.imageSrc}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-lg font-bold">
                    {entry.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full ring-4 shadow-lg",
                    style.ring,
                    style.size,
                    style.bg,
                  )}
                >
                  <School className={cn("h-6 w-6 sm:h-8 sm:w-8", style.text)} />
                </div>
              )}
            </div>

            <div
              className={cn(
                "flex flex-col items-center justify-end rounded-t-xl w-full min-w-[5rem] max-w-[8rem]",
                style.bg,
                style.height,
              )}
            >
              <p
                className="text-[11px] sm:text-sm font-semibold text-neutral-800 text-center px-2 leading-tight break-words"
                title={entry.name}
              >
                {entry.name}
              </p>
              <p className={cn("text-[11px] sm:text-xs font-bold mb-2 mt-1", style.text)}>
                {entry.points.toLocaleString("tr-TR")} Puan
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
