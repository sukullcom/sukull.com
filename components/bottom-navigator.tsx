"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

type BottomNavigatorProps = {
  className?: string;
};

export const BottomNavigator = ({ className }: BottomNavigatorProps) => {
  const pathname = usePathname();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { href: "/learn", iconSrc: "/desk.svg" },
    { href: "/leaderboard", iconSrc: "/leaderboard.svg" },
    { href: "/study-buddy", iconSrc: "/study_buddy.svg" },
    { href: "/profile", iconSrc: "/mascot_normal.svg" },
  ];

  const dropdownItems = [
    { label: "Özel Ders", href: "/private-lesson", iconSrc: "/private_lesson.svg" },
    { label: "Oyunlar", href: "/games", iconSrc: "/games.svg" },
    { label: "Mağaza", href: "/shop", iconSrc: "/bag.svg" },
    { label: "Hedefler", href: "/quests", iconSrc: "/quests.svg" },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 flex h-[60px] items-center justify-around border-t-2 border-slate-200 bg-white px-4 lg:hidden z-50",
        className
      )}
    >
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            prefetch={false}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5"
          >
            <Image
              src={item.iconSrc}
              alt=""
              height={isActive ? 36 : 32}
              width={isActive ? 36 : 32}
            />
            <div
              className={cn(
                "h-[3px] w-3 rounded-full transition-colors",
                isActive ? "bg-green-500" : "bg-transparent"
              )}
            />
          </Link>
        );
      })}

      {/* More dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!isDropdownOpen)}
          className="flex flex-col items-center justify-center gap-0.5"
        >
          <Image src="/more.svg" alt="Menu" height={32} width={32} />
          <div
            className={cn(
              "h-[3px] w-3 rounded-full transition-colors",
              isDropdownOpen ? "bg-green-500" : "bg-transparent"
            )}
          />
        </button>
        {isDropdownOpen && (
          <div className="absolute bottom-14 right-0 w-44 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
            <ul>
              {dropdownItems.map((item) => (
                <li key={item.href}>
                  <Link
                    prefetch={false}
                    href={item.href}
                    className="flex items-center px-4 py-2.5 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Image
                      src={item.iconSrc}
                      alt={item.label}
                      height={24}
                      width={24}
                      className="mr-2"
                    />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
