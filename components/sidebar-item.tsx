"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  /** Belirtilirse rota ile eşleşme yerine doğrudan bu değer kullanılır (sidebar rayı ile aynı eşlemeyi paylaşmak için). */
  active?: boolean;
  label: string;
  // Accept both forms `next/image`'s `src` prop supports: a string
  // URL/path (`"/study_buddy.svg"`) and a `StaticImageData` produced
  // by `import icon from "@/public/foo.svg"`. The latter gives Next
  // the width/height at build time so the layout doesn't reflow.
  iconSrc: string | StaticImageData;
  href: string;
};

export const SidebarItem = ({
  active: activeControlled,
  label,
  iconSrc,
  href,
}: Props) => {
  const pathname = usePathname();
  const activeFallback =
    pathname === href ||
    pathname.startsWith(href + "/");
  const active =
    typeof activeControlled === "boolean"
      ? activeControlled
      : activeFallback;

  return (
    <Button
      variant="sidebar"
      className={cn(
        "group relative h-[52px] w-full shrink-0 justify-start px-3 rounded-2xl transition-none",
        active &&
          "text-foreground font-semibold"
      )}
      asChild
    >
      <Link
        prefetch={false}
        href={href}
        className="flex w-full min-w-0 items-center"
      >
        <Image
          src={iconSrc}
          alt={label}
          className="mr-3"
          height={42}
          width={42}
        />
        <span className="text-left">{label}</span>
      </Link>
    </Button>
  );
};
