import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import { memo } from "react";

type Props = {
  title: string;
  id: number;
  imageSrc: string;
  onClick: (id: number) => void;
  disabled?: boolean;
  active?: boolean;
  category?: string;
};

const CATEGORY_STYLES: Record<string, { accent: string; activeBorder: string; badge: string }> = {
  matematik: { accent: "border-blue-300", activeBorder: "border-blue-500 bg-blue-50/40", badge: "bg-blue-100 text-blue-700" },
  turkce: { accent: "border-orange-300", activeBorder: "border-orange-500 bg-orange-50/40", badge: "bg-orange-100 text-orange-700" },
  fen: { accent: "border-emerald-300", activeBorder: "border-emerald-500 bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700" },
  fizik: { accent: "border-purple-300", activeBorder: "border-purple-500 bg-purple-50/40", badge: "bg-purple-100 text-purple-700" },
  ingilizce: { accent: "border-rose-300", activeBorder: "border-rose-500 bg-rose-50/40", badge: "bg-rose-100 text-rose-700" },
};

function extractLabel(title: string): string {
  const gradeMatch = title.match(/(\d+)\.\s*[Ss]ınıf\s+(.*)/);
  if (gradeMatch) return gradeMatch[1] + ". Sınıf";

  const engMatch = title.match(/İngilizce\s*\(([^)]+)\)/i);
  if (engMatch) return engMatch[1];

  return title;
}

export const Card = memo(
  ({ title, id, imageSrc, disabled, onClick, active, category }: Props) => {
    const style = CATEGORY_STYLES[category || ""] || CATEGORY_STYLES.matematik;
    const label = extractLabel(title);

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
            "text-xs font-bold px-2.5 py-1 rounded-full mt-1",
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
