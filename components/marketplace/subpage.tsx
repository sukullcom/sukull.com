import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function Subpage({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href={backHref}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-b-4 border-border bg-card transition-all hover:bg-muted active:translate-y-[2px] active:border-b-2"
          aria-label="Geri"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-extrabold">{title}</h1>
      </div>
      {children}
    </div>
  );
}
