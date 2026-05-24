"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

type BottomNavigatorProps = {
  className?: string;
};

type NavItem = {
  href: string;
  iconSrc: string;
  label: string;
};

/** Sidebar ile uyumlu: nötr yüzey + üstte ortalanmış ince primary çizgi (ikonla çakışmaz). */
const navItemActiveClass = cn(
  "relative rounded-xl border-2 border-transparent bg-muted/35 font-semibold text-foreground shadow-sm ring-1 ring-black/[0.05] dark:ring-white/[0.08]",
  "before:pointer-events-none before:absolute before:left-1/2 before:top-1 before:h-0.5 before:w-8 before:-translate-x-1/2 before:rounded-full before:bg-primary",
);
const navItemInactiveClass =
  "border-2 border-transparent bg-transparent text-muted-foreground";

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

  const navItems: NavItem[] = [
    { href: "/learn", iconSrc: "/learn.svg", label: "Dersler" },
    { href: "/leaderboard", iconSrc: "/leaderboard.svg", label: "Sıralama" },
    { href: "/private-lesson", iconSrc: "/private_lesson.svg", label: "Özel Ders" },
    { href: "/profile", iconSrc: "/profile.svg", label: "Profil" },
  ];

  const dropdownItems: NavItem[] = [
    { label: "Çalışma Arkadaşı", href: "/study-buddy", iconSrc: "/study_buddy.svg" },
    { label: "Oyunlar", href: "/games", iconSrc: "/games.svg" },
    { label: "Mağaza", href: "/shop", iconSrc: "/shop.svg" },
    { label: "Hedefler", href: "/quests", iconSrc: "/quests.svg" },
  ];

  const isMoreActive = dropdownItems.some((item) =>
    pathname.startsWith(item.href),
  );

  const itemShellClass = (active: boolean) =>
    cn(
      "flex min-w-[3.25rem] max-w-[4.5rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-1.5 transition-none pt-2",
      active ? navItemActiveClass : navItemInactiveClass,
    );

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex flex-col border-t border-border/40 bg-card shadow-[0_-4px_24px_-12px_rgba(15,23,42,0.08)] dark:shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.35)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] lg:hidden",
        className,
      )}
    >
      <div className="flex h-[var(--app-bottom-nav-row,4.5rem)] w-full min-h-0 items-stretch justify-around gap-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              prefetch={false}
              href={item.href}
              className={itemShellClass(isActive)}
              aria-current={isActive ? "page" : undefined}
            >
              <Image
                src={item.iconSrc}
                alt=""
                height={isActive ? 28 : 26}
                width={isActive ? 28 : 26}
                className="shrink-0"
              />
              <span
                className={cn(
                  "w-full truncate text-center text-[10px] font-semibold leading-tight",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        <div className="relative flex flex-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            className={cn(
              itemShellClass(isMoreActive || isDropdownOpen),
              "w-full",
            )}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
          >
            <Image
              src="/more.svg"
              alt=""
              height={26}
              width={26}
              className="shrink-0"
            />
            <span
              className={cn(
                "w-full truncate text-center text-[10px] font-semibold leading-tight",
                isMoreActive || isDropdownOpen
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Menü
            </span>
          </button>
          {isDropdownOpen && (
            <div
              role="menu"
              className="absolute bottom-full right-0 z-50 mb-2 w-48 rounded-xl border border-border bg-card shadow-lg"
            >
              <ul>
                {dropdownItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        prefetch={false}
                        href={item.href}
                        role="menuitem"
                        className={cn(
                          "flex items-center border-l-[3px] py-2.5 pl-[calc(theme(spacing.4)-3px)] pr-4 text-sm transition-none",
                          isActive
                            ? "border-l-primary bg-muted/30 font-semibold text-foreground"
                            : "border-l-transparent text-foreground hover:bg-muted",
                        )}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Image
                          src={item.iconSrc}
                          alt=""
                          height={24}
                          width={24}
                          className="mr-2 shrink-0"
                        />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
