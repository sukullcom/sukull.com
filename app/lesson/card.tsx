import { cn } from "@/lib/utils";
import { challenges } from "@/db/schema";
import Image from "next/image";
import { useCallback, useRef, useEffect } from "react";
import { MathRenderer } from "@/components/ui/math-renderer";

// Safe alternatives to react-use hooks
const useAudio = (config: { src: string }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (config.src) {
      audioRef.current = new Audio(config.src);
    }
  }, [config.src]);
  
  const controls = {
    play: () => audioRef.current?.play().catch(console.error)
  };
  
  return [null, null, controls] as const;
};

type Props = {
  id: number;
  imageSrc: string | null;
  audioSrc: string | null;
  text: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
  status?: "correct" | "wrong" | "none";
  type: (typeof challenges.$inferSelect)["type"];
};

export const Card = ({
  imageSrc,
  audioSrc,
  text,
  selected,
  onClick,
  status,
  disabled,
  type,
}: Props) => {
  const [audio, , controls] = useAudio({ src: audioSrc || "" });

  const handleClick = useCallback(() => {
    if (disabled) return;
    controls.play();
    onClick();
  }, [disabled, onClick, controls]);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "h-full rounded-2xl p-4 lg:p-6 cursor-pointer select-none transition-all duration-75 relative",
        // Default state (unselected):
        !selected && [
          "bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800",
          "border-2 border-slate-200",
          "shadow-[0_6px_0_#cbd5e1,0_10px_16px_-2px_rgba(100,116,139,0.12)]",
          "hover:border-slate-300 hover:brightness-105",
          "active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08),0_2px_0_#cbd5e1] active:bg-slate-100",
        ],
        // Selected state (chosen by user, before checking):
        selected && (!status || status === "none") && [
          "bg-gradient-to-b from-indigo-50 via-indigo-100/90 to-indigo-200 text-indigo-950 font-semibold",
          "border-2 border-indigo-400",
          "shadow-[0_6px_0_#6366f1,0_10px_16px_-2px_rgba(99,102,241,0.25)]",
          "active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(67,56,202,0.2),0_2px_0_#6366f1] active:bg-indigo-200",
        ],
        // Correct state:
        selected && status === "correct" && [
          "bg-gradient-to-b from-emerald-50 via-emerald-100/90 to-emerald-200 text-emerald-950 font-bold",
          "border-2 border-emerald-400",
          "shadow-[0_6px_0_#22c55e,0_10px_16px_-2px_rgba(34,197,94,0.25)]",
          "active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(21,128,61,0.2),0_2px_0_#22c55e]",
        ],
        // Wrong state:
        selected && status === "wrong" && [
          "bg-gradient-to-b from-rose-50 via-rose-100/90 to-rose-200 text-rose-950 font-bold",
          "border-2 border-rose-400",
          "shadow-[0_6px_0_#f43f5e,0_10px_16px_-2px_rgba(244,63,94,0.25)]",
          "active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(190,18,60,0.2),0_2px_0_#f43f5e]",
        ],
        disabled && "pointer-events-none opacity-60",
        type === "ASSIST" && "lg:p-3 w-full"
      )}
    >
      {audio}
      {imageSrc && (
        <div className="relative aspect-square mb-4 max-h-[140px] lg:max-h-[250px] w-full">
          <Image 
            src={imageSrc} 
            fill 
            alt={text} 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      {/* 🚀 UPDATED: Only render text container if text exists */}
      {text && text.trim() && (
        <div
          className={cn(
            "flex items-center justify-center",
            type === "ASSIST" && "flex-row-reverse"
          )}
        >
          <MathRenderer
            className={cn(
              "text-sm lg:text-base text-center transition-colors font-medium",
              !selected && "text-foreground",
              selected && (!status || status === "none") && "text-indigo-950 dark:text-indigo-100 font-bold",
              selected && status === "correct" && "text-emerald-950 dark:text-emerald-100 font-bold",
              selected && status === "wrong" && "text-rose-950 dark:text-rose-100 font-bold"
            )}
          >
            {text}
          </MathRenderer>
        </div>
      )}
    </div>
  );
};
