"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";
import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import Image from "next/image";

type BottomNavigatorProps = {
  className?: string;
};

export const BottomNavigator = ({ className }: BottomNavigatorProps) => {
  const pathname = usePathname();

  const navItems = [
    { href: "/learn", iconSrc: "/desk.svg" },
    { href: "/games", iconSrc: "/games.svg" },
    { href: "/leaderboard", iconSrc: "/leaderboard.svg" },
    { href: "/lab", iconSrc: "/lab.svg" },
    { href: "/quests", iconSrc: "/quests.svg" },
    { href: "/shop", iconSrc: "/bag.svg" },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 w-full bg-white border-t flex justify-around items-center px-4 py-2 shadow-md z-50", // Ensure z-index is high
        className
      )}
      style={{ height: "64px" }} // Explicitly set height
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center text-xs",
              isActive ? "text-green-600" : "text-gray-600 hover:text-green-600"
            )}
          >
            <Image
              src={item.iconSrc}
              alt={""}
              className="mr-5"
              height={48}
              width={48}
            />
          </Link>
        );
      })}
      <div className="p-4">
        <ClerkLoading>
          <Loader
            className="h-5 w-5 text-muted-foreground animate-spin"
            aria-label="Yükleniyor..."
          />
        </ClerkLoading>
        <ClerkLoaded>
          <UserButton afterSwitchSessionUrl="/" />
        </ClerkLoaded>
      </div>
    </div>
  );
};
