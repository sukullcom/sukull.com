// components/user-progress.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { InfinityIcon } from "lucide-react"; // import Fire icon for streak
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
    <div className="flex items-center justify-center gap-x-1 w-full">
      <Link prefetch={false} href="/courses">
        <Button variant="ghost" className="p-2">
          <Image
            src={normalizeAvatarUrl(activeCourse.imageSrc)}
            alt={activeCourse.title}
            className="rounded-md border"
            width={32}
            height={32}
          />
        </Button>
      </Link>
      <Link prefetch={false} href="/shop">
        <Button variant="ghost" className="text-orange-500 p-2">
          <Image
            src="/points.svg"
            height={28}
            width={28}
            alt="Points"
            className="mr-1"
          />
          {points}
        </Button>
      </Link>
      <Link prefetch={false} href="/shop">
        <Button variant="ghost" className="text-rose-500 p-2">
          <Image
            src="/heart.svg"
            height={22}
            width={22}
            alt="Hearts"
            className="mr-2"
          />
          {hasInfiniteHearts ? (
            <InfinityIcon className="h-4 w-4 stroke-[3]" />
          ) : (
            hearts
          )}
        </Button>
      </Link>
      <Link prefetch={false} href="/profile">
        <Button variant="ghost" className="text-red-500 p-2">
          <Image
            src="/istikrar.svg"
            height={22}
            width={22}
            alt="İstikrar"
            className="mr-2"
          />
          {istikrar}
        </Button>
      </Link>

      <Link prefetch={false} href={"/private-lesson"}>
        <Button className="p-2 text-xs" variant="sidebarOutline">
          Özel Ders Al / Ver
        </Button>
      </Link>
    </div>
  );
};
