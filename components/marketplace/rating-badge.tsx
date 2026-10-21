import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function formatRating(average: number): string {
  return average.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function RatingBadge({
  average,
  count,
  className,
}: {
  average: number;
  count: number;
  className?: string;
}) {
  if (count === 0) {
    return <p className={cn("text-xs font-semibold text-muted-foreground", className)}>Henüz değerlendirme yok</p>;
  }
  return (
    <p
      className={cn("flex items-center gap-1 text-xs font-semibold text-muted-foreground", className)}
      aria-label={`5 üzerinden ${formatRating(average)} puan, ${count} değerlendirme`}
    >
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
      <span className="font-extrabold text-foreground">{formatRating(average)}</span>
      <span>· {count} değerlendirme</span>
    </p>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" aria-label={`5 üzerinden ${value} yıldız`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={cn("h-3.5 w-3.5", index <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
          aria-hidden
        />
      ))}
    </span>
  );
}
