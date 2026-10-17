import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Lock } from "lucide-react";
import type { SubjectColorConfig } from "@/lib/subject-colors";

type Props = {
  title: string;
  description: string;
  activeLessonId?: number;
  hasContent?: boolean;
  subjectColor: SubjectColorConfig;
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function mix(a: string, b: string, t: number) {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  return rgbToHex(from.r + (to.r - from.r) * t, from.g + (to.g - from.g) * t, from.b + (to.b - from.b) * t);
}

export const UnitBanner = ({ title, description, activeLessonId, hasContent = true, subjectColor }: Props) => {
  const isUnitComplete = hasContent && !activeLessonId;

  const bannerStyle: React.CSSProperties = !hasContent
    ? {
        background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
        borderColor: "#cbd5e1",
        color: "#64748b",
        boxShadow: "0 6px 0 #94a3b8, 0 10px 18px -4px rgba(100,116,139,0.15)",
      }
    : isUnitComplete
      ? {
          background: `linear-gradient(180deg, ${subjectColor.hexDark} 0%, ${mix(subjectColor.hexDark, "#000000", 0.2)} 100%)`,
          borderColor: mix(subjectColor.hexDark, "#000000", 0.15),
          color: "#ffffff",
          boxShadow: `0 6px 0 ${mix(subjectColor.hexDark, "#000000", 0.35)}, 0 12px 24px -4px rgba(0,0,0,0.2)`,
        }
      : {
          background: `linear-gradient(180deg, ${subjectColor.hex} 0%, ${subjectColor.hexDark} 100%)`,
          borderColor: subjectColor.hexDark,
          color: "#ffffff",
          boxShadow: `0 6px 0 ${mix(subjectColor.hexDark, "#000000", 0.3)}, 0 12px 24px -4px rgba(0,0,0,0.2)`,
        };

  return (
    <div
      className="relative z-30 w-full rounded-2xl border-2 p-5 lg:p-6 text-white flex items-center justify-between min-h-[96px] mb-8 transition-all"
      style={bannerStyle}
    >
      <div className="space-y-1.5 flex-1 min-w-0 pr-4">
        <h3 className="text-2xl font-extrabold tracking-tight drop-shadow-sm">{title}</h3>
        <p className="text-sm sm:text-base lg:text-lg opacity-95 font-medium line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
      {!hasContent ? (
        <div className="hidden xl:flex items-center gap-2 bg-black/10 border border-black/10 px-4 py-2 rounded-xl text-slate-600 font-semibold shrink-0">
          <Lock className="h-4 w-4" />
          Yakında
        </div>
      ) : isUnitComplete ? (
        <div className="hidden xl:flex items-center gap-2 bg-white/20 border border-white/25 px-4 py-2 rounded-xl text-white font-bold shrink-0 shadow-sm">
          <CheckCircle className="h-5 w-5" />
          Tamamlandı
        </div>
      ) : (
        <Link prefetch={false} href={`/lesson/${activeLessonId}`} className="shrink-0">
          <button
            className="hidden xl:inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold tracking-wide cursor-pointer transition-all duration-75 border-2 border-black/10 bg-white/20 text-white hover:bg-white/30 active:translate-y-[3px] px-6 h-12 shadow-[0_4px_0_rgba(0,0,0,0.22)] active:shadow-[0_1px_0_rgba(0,0,0,0.22)]"
          >
            <Image
              src="/continue_icon.svg"
              alt=""
              width={22}
              height={22}
              className="mr-2 h-5 w-5"
              aria-hidden
            />
            Devam Et
          </button>
        </Link>
      )}
    </div>
  );
};
