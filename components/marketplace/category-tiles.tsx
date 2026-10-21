import {
  Camera,
  Car,
  Check,
  Code,
  GraduationCap,
  HeartPulse,
  Paintbrush,
  PartyPopper,
  PawPrint,
  Sparkles,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

import { CATEGORIES } from "@/lib/marketplace/catalog";
import { CATEGORY_IMAGES } from "@/lib/marketplace/category-images";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  temizlik: Sparkles,
  tadilat: Paintbrush,
  nakliyat: Truck,
  tamir: Wrench,
  "ozel-ders": GraduationCap,
  yazilim: Code,
  ulasim: Car,
  organizasyon: PartyPopper,
  saglik: HeartPulse,
  "evcil-hayvan": PawPrint,
  fotograf: Camera,
};

const CATEGORY_TONE: Record<string, string> = {
  temizlik: "from-sky-100 to-sky-300",
  tadilat: "from-amber-100 to-orange-300",
  nakliyat: "from-stone-100 to-stone-300",
  tamir: "from-slate-100 to-slate-300",
  "ozel-ders": "from-violet-100 to-violet-300",
  yazilim: "from-indigo-100 to-indigo-300",
  ulasim: "from-emerald-100 to-emerald-300",
  organizasyon: "from-rose-100 to-rose-300",
  saglik: "from-teal-100 to-teal-300",
  "evcil-hayvan": "from-lime-100 to-lime-300",
  fotograf: "from-fuchsia-100 to-fuchsia-300",
};

export function CategoryTiles({
  onSelect,
  badges,
}: {
  onSelect: (slug: string) => void;
  /** Kategori başına kart üstünde gösterilecek sayı (ör. eklenen hizmet sayısı). */
  badges?: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CATEGORIES.map((item) => {
        const Icon = CATEGORY_ICONS[item.slug] ?? Sparkles;
        const badge = badges?.[item.slug] ?? 0;
        const image = CATEGORY_IMAGES[item.slug];
        return (
          <button
            key={item.slug}
            type="button"
            onClick={() => onSelect(item.slug)}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-2xl border-2 border-b-[5px] bg-card text-left transition-[transform,border-width,background-color] hover:bg-muted/40 active:translate-y-[3px] active:border-b-2",
              badge > 0 ? "border-suk-brand/50" : "border-border",
            )}
          >
            <span
              className={`relative flex h-24 shrink-0 items-center justify-center bg-gradient-to-br ${CATEGORY_TONE[item.slug] ?? "from-slate-100 to-slate-300"}`}
            >
              {image ? (
                <Image
                  src={image.src}
                  alt=""
                  fill
                  unoptimized
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <Icon className="h-10 w-10 text-slate-800/80" aria-hidden />
              )}
            </span>
            {badge > 0 && (
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-suk-brand px-2 py-0.5 text-xs font-bold text-suk-brand-fg">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                {badge}
              </span>
            )}
            <span className="block flex-1 px-3 py-3 text-sm font-bold">{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}
