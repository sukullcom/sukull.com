import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import { memo } from "react";

type Props = {
  title: string;
  id: number;
  label: string;
  imageSrc: string;
  onClick: (id: number) => void;
  disabled?: boolean;
  active?: boolean;
  category?: string;
};

const CATEGORY_STYLES: Record<string, { activeBorder: string; badge: string }> = {
  matematik:  { activeBorder: "border-blue-500 bg-blue-50/40",     badge: "bg-blue-100 text-blue-700" },
  turkce:     { activeBorder: "border-orange-500 bg-orange-50/40", badge: "bg-orange-100 text-orange-700" },
  fen:        { activeBorder: "border-emerald-500 bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700" },
  fizik:      { activeBorder: "border-cyan-500 bg-cyan-50/40",     badge: "bg-cyan-100 text-cyan-700" },
  kimya:      { activeBorder: "border-violet-500 bg-violet-50/40", badge: "bg-violet-100 text-violet-700" },
  biyoloji:   { activeBorder: "border-lime-500 bg-lime-50/40",     badge: "bg-lime-100 text-lime-700" },
  tarih:      { activeBorder: "border-amber-500 bg-amber-50/40",   badge: "bg-amber-100 text-amber-700" },
  cografya:   { activeBorder: "border-teal-500 bg-teal-50/40",     badge: "bg-teal-100 text-teal-700" },
  felsefe:    { activeBorder: "border-slate-500 bg-muted/40",   badge: "bg-muted text-foreground" },
  dinkulturu: { activeBorder: "border-slate-500 bg-muted/40",   badge: "bg-muted text-foreground" },
  sosyal:     { activeBorder: "border-amber-500 bg-amber-50/40",   badge: "bg-amber-100 text-amber-700" },
  ingilizce:  { activeBorder: "border-rose-500 bg-rose-50/40",     badge: "bg-rose-100 text-rose-700" },
  diger:      { activeBorder: "border-gray-500 bg-muted/40",     badge: "bg-muted text-foreground" },
};

export const Card = memo(
  ({ title, id, label, imageSrc, disabled, onClick, active, category }: Props) => {
    const style = CATEGORY_STYLES[category || "diger"] || CATEGORY_STYLES.diger;

    return (
      <div
        onClick={() => onClick(id)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(id);
          }
        }}
        className={cn(
          "shrink-0 w-[140px] sm:w-auto",
          "relative flex cursor-pointer flex-col items-center rounded-2xl border-2 p-3 pb-3 transition-all",
          "border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100",
          "shadow-[0_5px_0_#cbd5e1] hover:brightness-[1.02] active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(15,23,42,0.08),0_1px_0_#cbd5e1]",
          active && style.activeBorder,
          disabled && "pointer-events-none opacity-50"
        )}
      >
        {active && (
          <div className="absolute -top-1.5 -right-1.5 rounded-full bg-green-500 flex items-center justify-center w-6 h-6 shadow-sm">
            <Check className="text-white stroke-[3] h-3.5 w-3.5" />
          </div>
        )}

        <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] relative my-2">
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="72px"
            loading="lazy"
            className="rounded-xl object-cover drop-shadow-sm"
          />
        </div>

        <span
          className={cn(
            "text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full mt-1 text-center leading-tight",
            style.badge
          )}
        >
          {label}
        </span>
      </div>
    );
  }
);

Card.displayName = "Card";
