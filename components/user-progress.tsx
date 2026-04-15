import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { InfinityIcon } from "lucide-react";
import { courses } from "@/db/schema";
import { normalizeAvatarUrl } from "@/utils/avatar";

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
    <div className="flex items-center w-full px-2 gap-1">
      <Link prefetch={false} href="/learn" className="shrink-0 mr-auto">
        <div className="flex items-center gap-1.5 p-1">
          <Image
            src="/mascot_purple.svg"
            height={24}
            width={24}
            alt="Sukull"
          />
          <span className="text-sm font-extrabold text-green-500 tracking-wide">
            Sukull
          </span>
        </div>
      </Link>
      <Link prefetch={false} href="/courses" className="shrink-0">
        <Button variant="ghost" className="p-1.5">
          <Image
            src={normalizeAvatarUrl(activeCourse.imageSrc)}
            alt={activeCourse.title}
            className="rounded-md border"
            width={26}
            height={26}
          />
        </Button>
      </Link>
      <Link prefetch={false} href="/shop" className="shrink-0">
        <Button variant="ghost" className="text-orange-500 p-1.5 text-xs">
          <Image
            src="/points.svg"
            height={18}
            width={18}
            alt="Puan"
            className="mr-0.5"
          />
          {points}
        </Button>
      </Link>
      <Link prefetch={false} href="/shop" className="shrink-0">
        <Button variant="ghost" className="text-rose-500 p-1.5 text-xs">
          <Image
            src="/heart.svg"
            height={18}
            width={18}
            alt="Can"
            className="mr-0.5"
          />
          {hasInfiniteHearts ? (
            <InfinityIcon className="h-4 w-4 stroke-[3]" />
          ) : (
            hearts
          )}
        </Button>
      </Link>
      <Link prefetch={false} href="/profile" className="shrink-0">
        <Button variant="ghost" className="text-orange-600 p-1.5 text-xs">
          <Image
            src="/istikrar.svg"
            height={18}
            width={18}
            alt="İstikrar"
            className="mr-0.5"
          />
          {istikrar}
        </Button>
      </Link>
    </div>
  );
};
