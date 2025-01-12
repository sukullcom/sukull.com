"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

type Props = {
  label: string;
  iconSrc: string;
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
      <Link href={href} className="flex items-center">
        <Image
          src={iconSrc}
          alt={label}
          className="mr-3"
          height={48}
          width={48}
        />
        <span className="text-left">{label}</span> 
      </Link>
    </Button>
  );
};
