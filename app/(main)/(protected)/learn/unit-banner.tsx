import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NotebookText, CheckCircle, Lock } from "lucide-react";

type Props = {
  title: string;
  description: string;
  activeLessonId?: number;
  hasContent?: boolean;
};

export const UnitBanner = ({ title, description, activeLessonId, hasContent = true }: Props) => {
  const isUnitComplete = hasContent && !activeLessonId;

  const bgColor = !hasContent
    ? "bg-gray-400"
    : isUnitComplete
      ? "bg-emerald-600"
      : "bg-green-500";

  return (
    <div className={`w-full rounded-xl p-5 text-white flex items-center justify-between ${bgColor}`}>
      <div className="space-y-2.5">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-lg">{description}</p>
      </div>
      {!hasContent ? (
        <div className="hidden xl:flex items-center gap-2 text-white/70 font-medium">
          <Lock className="h-5 w-5" />
          Yakında
        </div>
      ) : isUnitComplete ? (
        <div className="hidden xl:flex items-center gap-2 text-white font-bold">
          <CheckCircle className="h-6 w-6" />
          Tamamlandı
        </div>
      ) : (
        <Link prefetch={false} href={`/lesson/${activeLessonId}`}>
          <Button
            size="lg"
            variant="secondary"
            className="hidden xl:flex border-2 border-b-4 activate:border-b-2"
          >
            <NotebookText className="mr-2" />
            Devam Et
          </Button>
        </Link>
      )}
    </div>
  );
};
