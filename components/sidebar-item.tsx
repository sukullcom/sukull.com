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
            "border-0 font-semibold text-foreground shadow-sm ring-1 ring-black/[0.05] dark:ring-white/[0.08]",
            "rounded-[14px] bg-muted/35",
            /* Sol accent: kenara yakın, içerik pl ile ikondan uzak tutuluyor */
            "before:pointer-events-none before:absolute before:inset-y-2.5 before:left-3 before:z-0 before:w-[2px] before:rounded-full before:bg-primary",
            "before:transition-opacity hover:before:opacity-80",
          ),
        !active && "hover:bg-suk-surface-muted",
      )}
      asChild
    >
      <Link
        prefetch={false}
        href={href}
        className={cn(
          "relative z-[1] flex min-w-0 flex-1 items-center",
          /* Aktifken çubuktan sonra yeterli boşluk (ikon 42px) */
          active ? "pl-5" : "pl-2",
        )}
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
