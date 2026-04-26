"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";

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
      variant={active ? "sidebarOutline" : "sidebar"}
      className="justify-start h-[52px] flex items-center"
      asChild
    >
      <Link prefetch={false} href={href} className="flex items-center">
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
