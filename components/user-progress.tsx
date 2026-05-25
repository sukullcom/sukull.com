import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { InfinityIcon } from "lucide-react";
import { courses } from "@/db/schema";
import { normalizeAvatarUrl } from "@/utils/avatar";
import { BRAND_MASCOT_PATH } from "@/lib/brand-mascot";

type Props = {
  activeCourse: typeof courses.$inferSelect;
  hearts: number;
  points: number;
  istikrar: number;
  hasInfiniteHearts: boolean;
};

export const UserProgress = ({
  activeCourse,
  points,
  hearts,
  istikrar,
  hasInfiniteHearts,
}: Props) => {
  return (
    <div className="flex items-center w-full px-2 gap-1.5">
      <Link prefetch={false} href="/learn" className="shrink-0 mr-auto">
        <div className="flex items-center gap-1.5 p-1">
          <Image
            src={BRAND_MASCOT_PATH}
            height={28}
            width={28}
            alt="Sukull"
            className="object-contain"
          />
          <span className="text-base font-extrabold tracking-wide text-suk-brand">
            Sukull
          </span>
        </div>
      </Link>
      <Link prefetch={false} href="/courses" className="shrink-0">
        <Button variant="ghost" className="p-2">
          <Image
            src={normalizeAvatarUrl(activeCourse.imageSrc)}
            alt={activeCourse.title}
            className="rounded-md border"
            width={30}
            height={30}
          />
        </Button>
      </Link>
      <Link prefetch={false} href="/shop" className="shrink-0">
        <Button variant="ghost" className="p-2 text-sm font-bold text-purple-600">
          <Image
            src="/points_icon.svg"
            height={22}
            width={22}
            alt="Puan"
            className="mr-1"
          />
          {points}
        </Button>
      </Link>
      <Link prefetch={false} href="/shop" className="shrink-0">
        <Button variant="ghost" className="p-2 text-sm font-bold text-suk-danger">
          <Image
            src="/heart.svg"
            height={22}
            width={22}
            alt="Can"
            className="mr-1"
          />
          {hasInfiniteHearts ? (
            <InfinityIcon className="h-5 w-5 stroke-[3]" />
          ) : (
            hearts
          )}
        </Button>
      </Link>
      {/*
        Puan: mor ikon + mor metin. İstikrar ayrı renkte kalır (`text-suk-warning`).
      */}
      <Link prefetch={false} href="/profile" className="shrink-0">
        <Button variant="ghost" className="p-2 text-sm font-bold text-suk-warning">
          <Image
            src="/istikrar.svg"
            height={22}
            width={22}
            alt="İstikrar"
            className="mr-1"
          />
          {istikrar}
        </Button>
      </Link>
    </div>
  );
};
