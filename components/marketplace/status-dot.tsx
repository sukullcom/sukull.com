import type { RequestTone } from "@/lib/marketplace/format";

const DOT: Record<RequestTone, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  blue: "bg-sky-500",
  red: "bg-red-500",
  gray: "bg-slate-400",
};

const TEXT: Record<RequestTone, string> = {
  green: "text-emerald-700",
  yellow: "text-amber-700",
  blue: "text-sky-700",
  red: "text-red-700",
  gray: "text-muted-foreground",
};

export function StatusDot({ tone, label }: { tone: RequestTone; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${TEXT[tone]}`}>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[tone]}`} aria-hidden />
      {label}
    </span>
  );
}
