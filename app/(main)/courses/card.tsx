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
};

function getSubjectStyle(title: string): { bg: string; text: string; border: string } {
  const t = title.toLowerCase();
  if (t.includes("matematik")) return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
  if (t.includes("türkçe") || t.includes("türk dili") || t.includes("edebiyat"))
    return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" };
  if (t.includes("fen bilimleri")) return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
  if (t.includes("fizik")) return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" };
  if (t.includes("ingilizce")) return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };
  return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
}

function extractLabel(title: string): { grade: string; subject: string } {
  const gradeMatch = title.match(/(\d+)\.\s*[Ss]ınıf\s+(.*)/);
  if (gradeMatch) {
    return { grade: gradeMatch[1] + ". Sınıf", subject: gradeMatch[2] };
  }
  const engMatch = title.match(/İngilizce\s*\(([^)]+)\)\s*—?\s*(.*)/i);
  if (engMatch) {
    return { grade: engMatch[2]?.trim() || "", subject: engMatch[1] };
  }
  return { grade: "", subject: title };
}

export const Card = memo(
  ({ title, id, imageSrc, disabled, onClick, active }: Props) => {
    const style = getSubjectStyle(title);
    const { grade, subject } = extractLabel(title);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(id);
      }
    };

    return (
      <div
        onClick={() => onClick(id)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={`Kurs: ${title}${active ? " (aktif)" : ""}`}
        className={cn(
          "relative border-2 rounded-xl border-b-4 hover:bg-black/5 cursor-pointer active:border-b-2 flex flex-col items-center p-3 pb-4 min-h-[180px] transition-all",
          active && "border-green-400 bg-green-50/30",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        {active && (
          <div className="absolute top-2 right-2 rounded-md bg-green-600 flex items-center justify-center p-1">
            <Check className="text-white stroke-[4] h-3.5 w-3.5" />
          </div>
        )}

        <div className="flex-1 flex items-center justify-center py-2">
          <Image
            src={imageSrc}
            alt={title}
            height={56}
            width={75}
            loading="lazy"
            className="rounded-lg drop-shadow-md border object-cover"
          />
        </div>

        <div className="w-full text-center space-y-1">
          {grade && (
            <span
              className={cn(
                "inline-block text-xs font-semibold px-2 py-0.5 rounded-full",
                style.bg,
                style.text
              )}
            >
              {grade}
            </span>
          )}
          <p className="text-neutral-700 text-sm font-bold leading-tight">
            {subject}
          </p>
        </div>
      </div>
    );
  }
);

Card.displayName = "Card";
