"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  // Accept both forms `next/image`'s `src` prop supports: a string
  // URL/path (`"/study_buddy.svg"`) and a `StaticImageData` produced
  // by `import icon from "@/public/foo.svg"`. The latter gives Next
  // the width/height at build time so the layout doesn't reflow.
  iconSrc: string | StaticImageData;
  href: string;
};

export const SidebarItem = ({
  label,
  iconSrc,
  href,
}: Props) => {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  return (
    <Button
      variant="sidebar"
      className={cn(
        "group relative h-[52px] w-full justify-start px-3",
        "rounded-2xl border-2 border-transparent",
        active &&
          cn(
            "border-border/35 bg-muted/55 font-semibold text-foreground shadow-sm",
            /** Sol şerit vurgu + hafif kapsül algısı (yeşil dolgu yerine). */
            "before:pointer-events-none before:absolute before:inset-y-2 before:left-2 before:w-1 before:rounded-full before:bg-suk-brand",
            "before:transition-opacity hover:before:opacity-90",
          ),
        !active && "hover:bg-suk-surface-muted",
      )}
      asChild
    >
      <Link prefetch={false} href={href} className="flex flex-1 items-center pl-2">
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
