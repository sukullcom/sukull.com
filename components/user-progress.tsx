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
    <div className="flex items-center justify-between w-full px-2 gap-1">
      <Link prefetch={false} href="/courses" className="shrink-0">
        <Button variant="ghost" className="p-1.5">
          <Image
            src={normalizeAvatarUrl(activeCourse.imageSrc)}
            alt={activeCourse.title}
            className="rounded-md border"
            width={28}
            height={28}
          />
        </Button>
      </Link>
      <Link prefetch={false} href="/shop" className="shrink-0">
        <Button variant="ghost" className="text-orange-500 p-1.5 text-xs">
          <Image
            src="/points.svg"
            height={20}
            width={20}
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
            height={20}
            width={20}
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
            height={20}
            width={20}
            alt="İstikrar"
            className="mr-0.5"
          />
          {istikrar}
        </Button>
      </Link>
      <Link prefetch={false} href="/private-lesson" className="shrink-0">
        <Button className="p-1.5 text-[10px] whitespace-nowrap" variant="sidebarOutline">
          Özel Ders
        </Button>
      </Link>
    </div>
  );
};
