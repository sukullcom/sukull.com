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
  matematik:  { activeBorder: "border-blue-500 bg-blue-50/40",    badge: "bg-blue-100 text-blue-700" },
  turkce:     { activeBorder: "border-orange-500 bg-orange-50/40", badge: "bg-orange-100 text-orange-700" },
  fen:        { activeBorder: "border-emerald-500 bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700" },
  fizik:      { activeBorder: "border-purple-500 bg-purple-50/40",  badge: "bg-purple-100 text-purple-700" },
  kimya:      { activeBorder: "border-amber-500 bg-amber-50/40",   badge: "bg-amber-100 text-amber-700" },
  biyoloji:   { activeBorder: "border-lime-500 bg-lime-50/40",     badge: "bg-lime-100 text-lime-700" },
  tarih:      { activeBorder: "border-yellow-500 bg-yellow-50/40", badge: "bg-yellow-100 text-yellow-700" },
  cografya:   { activeBorder: "border-teal-500 bg-teal-50/40",    badge: "bg-teal-100 text-teal-700" },
  ingilizce:  { activeBorder: "border-rose-500 bg-rose-50/40",    badge: "bg-rose-100 text-rose-700" },
  diger:      { activeBorder: "border-gray-500 bg-gray-50/40",    badge: "bg-gray-100 text-gray-700" },
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
          "relative border-2 rounded-2xl cursor-pointer flex flex-col items-center p-3 pb-3 transition-all",
          "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
          "bg-white border-gray-200",
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
