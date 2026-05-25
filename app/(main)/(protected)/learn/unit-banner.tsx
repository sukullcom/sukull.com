import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lock } from "lucide-react";
import type { SubjectColorConfig } from "@/lib/subject-colors";

type Props = {
  title: string;
  description: string;
  activeLessonId?: number;
  hasContent?: boolean;
  subjectColor: SubjectColorConfig;
};

export const UnitBanner = ({ title, description, activeLessonId, hasContent = true, subjectColor }: Props) => {
  const isUnitComplete = hasContent && !activeLessonId;

  const bgStyle: React.CSSProperties = !hasContent
    ? { backgroundColor: "hsl(var(--suk-neutral-locked) / 1)" }
    : isUnitComplete
      ? { backgroundColor: subjectColor.hexDark }
      : { background: `linear-gradient(to bottom right, ${subjectColor.hex}, ${subjectColor.hexDark})` };

  return (
    <div
      className="relative z-30 w-full rounded-xl p-5 text-white flex items-center justify-between min-h-[88px]"
      style={bgStyle}
    >
      <div className="space-y-1 flex-1 min-w-0">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-lg line-clamp-2">{description}</p>
      </div>
      {!hasContent ? (
        <div className="hidden xl:flex items-center gap-2 text-white/70 font-medium shrink-0 ml-4">
          <Lock className="h-5 w-5" />
          Yakında
        </div>
      ) : isUnitComplete ? (
        <div className="hidden xl:flex items-center gap-2 text-white font-bold shrink-0 ml-4">
          <CheckCircle className="h-6 w-6" />
          Tamamlandı
        </div>
      ) : (
        <Link prefetch={false} href={`/lesson/${activeLessonId}`} className="shrink-0 ml-4">
          <Button
            size="lg"
            variant="ghost"
            className="hidden xl:flex border-2 border-b-4 border-white/30 border-b-white/15 bg-white/20 text-white hover:bg-white/30 active:border-b-2"
          >
            <Image
              src="/continue_icon.svg"
              alt=""
              width={24}
              height={24}
              className="mr-2 h-6 w-6"
              aria-hidden
            />
            Devam Et
          </Button>
        </Link>
      )}
    </div>
  );
};
