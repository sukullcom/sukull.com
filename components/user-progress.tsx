// components/user-progress.tsx
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
  istikrar: number; // new prop for streak
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
    <div className="flex items-center justify-center w-full px-1 overflow-x-auto scrollbar-hide">
      <Link prefetch={false} href="/courses">
        <Button variant="ghost" className="p-1.5 shrink-0">
          <Image
            src={normalizeAvatarUrl(activeCourse.imageSrc)}
            alt={activeCourse.title}
            className="rounded-md border"
            width={28}
            height={28}
          />
        </Button>
      </Link>
      <Link prefetch={false} href="/shop">
        <Button variant="ghost" className="text-orange-500 p-1.5 text-xs shrink-0">
          <Image
            src="/points.svg"
            height={22}
            width={22}
            alt="Puan"
            className="mr-0.5"
          />
          {points}
        </Button>
      </Link>
      <Link prefetch={false} href="/shop">
        <Button variant="ghost" className="text-rose-500 p-1.5 text-xs shrink-0">
          <Image
            src="/heart.svg"
            height={20}
            width={20}
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
      <Link prefetch={false} href="/profile">
        <Button variant="ghost" className="text-red-500 p-1.5 text-xs shrink-0">
          <Image
            src="/istikrar.svg"
            height={20}
            width={20}
            alt="İstikrar"
            className="mr-1"
          />
          {istikrar}
        </Button>
      </Link>

      <Link prefetch={false} href={"/private-lesson"}>
        <Button className="p-1.5 text-[10px] whitespace-nowrap shrink-0" variant="sidebarOutline">
          Özel Ders
        </Button>
      </Link>
    </div>
  );
};
