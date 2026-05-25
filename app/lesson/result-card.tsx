import Image from "next/image";
import { cn } from "@/lib/utils";
import { InfinityIcon } from "lucide-react";

type Props = {
  value: number;
  variant: "points" | "hearts";
  hasInfiniteHearts?: boolean;
};

export const ResultCard = ({ value, variant, hasInfiniteHearts = false }: Props) => {
  const imageSrc = variant === "hearts" ? "/heart.svg" : "/points_icon.svg";

  return (
    <div
      className={cn(
        "rounded-2xl border-2 w-full",
        variant === "points" && "bg-purple-500 border-purple-500",
        variant === "hearts" && "bg-rose-500 border-rose-500"
      )}
    >
      <div
        className={cn(
          "p-1.5 text-white rounded-t-xl font-bold text-center uppercase text-xs",
          variant === "hearts" && "bg-rose-500",
          variant === "points" && "bg-purple-500"
        )}
      >
        {variant === "hearts" ? "Kalan Can" : "Kazanılan Puan"}
      </div>
      <div
        className={cn(
          "rounded-2xl bg-card items-center flex justify-center p-6 font-bold text-lg",
          variant === "hearts" && "text-rose-500",
          variant === "points" && "text-purple-600"
        )}
      >
        <Image alt="Icon" src={imageSrc} height={30} width={30} className="mr-1.5" />
        {variant === "hearts" && hasInfiniteHearts ? (
          <InfinityIcon className="h-6 w-6 stroke-[3]" />
        ) : (
          value
        )}
      </div>
    </div>
  );
};
