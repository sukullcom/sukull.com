"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { BottomNavRailButtonBox } from "./bottom-nav-rail";
import { BottomNavRailSvg } from "./bottom-nav-rail";

type BottomNavigatorProps = {
  className?: string;
};

type NavItem = {
  href: string;
  iconSrc: string;
  label: string;
};

const MORE_ROW_KEY = "__more__";

const PRIMARY_NAV: NavItem[] = [
  { href: "/learn", iconSrc: "/learn.svg", label: "Dersler" },
  { href: "/leaderboard", iconSrc: "/leaderboard.svg", label: "Sıralama" },
  {
    href: "/private-lesson",
    iconSrc: "/private_lesson.svg",
    label: "Özel Ders",
  },
  { href: "/profile", iconSrc: "/profile.svg", label: "Profil" },
];

const DROPDOWN_NAV: NavItem[] = [
  {
    label: "Çalışma Arkadaşı",
    href: "/study-buddy",
    iconSrc: "/study_buddy.svg",
  },
  { label: "Oyunlar", href: "/games", iconSrc: "/games.svg" },
  { label: "Mağaza", href: "/shop", iconSrc: "/shop.svg" },
  { label: "Hedefler", href: "/quests", iconSrc: "/quests.svg" },
];

const ALL_HREFS = [
  ...PRIMARY_NAV.map(({ href }) => href),
  ...DROPDOWN_NAV.map(({ href }) => href),
];

function resolveActiveBottomNavRow(pathname: string): string | null {
  const sorted = [...ALL_HREFS].sort((a, b) => b.length - a.length);
  const hit = sorted.find(
    (href) => pathname === href || pathname.startsWith(href + "/")
  );
  if (!hit) return null;
  if (DROPDOWN_NAV.some(({ href }) => href === hit)) return MORE_ROW_KEY;
  return hit;
}

export const BottomNavigator = ({ className }: BottomNavigatorProps) => {
  const pathname = usePathname() ?? "";
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const navRowRef = useRef<HTMLDivElement>(null);

  const activeRow = resolveActiveBottomNavRow(pathname);

  const [railGeom, setRailGeom] = useState<{
    w: number;
    h: number;
    yRail: number;
    btn: BottomNavRailButtonBox | null;
  }>({
    w: 0,
    h: 0,
    yRail: 2,
    btn: null,
  });

  const measureRail = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const bb = root.getBoundingClientRect();
    const rw = bb.width || root.offsetWidth || 1;
    const rh = bb.height || root.offsetHeight || 1;
    /** İçerik–alt menü sınırı: stroke yaklaşık ortalanır (~2 px). */
    const yRailPx = 2;

    let btn: BottomNavRailButtonBox | null = null;

    if (activeRow && navRowRef.current) {
      const rowEl = Array.from(
        navRowRef.current.querySelectorAll<HTMLElement>("[data-bottom-nav-row]")
      ).find((el) => el.dataset.bottomNavRow === activeRow);
      if (rowEl) {
        const ir = rowEl.getBoundingClientRect();
        const band = ir.width;
        btn = {
          left: ir.left - bb.left,
          top: ir.top - bb.top,
          right: ir.right - bb.left,
          bottom: ir.bottom - bb.top,
          rx: Math.min(12, Math.max(6, Math.round(band / 2) - 8)),
        };
      }
    }

    setRailGeom({
      w: Math.ceil(rw),
      h: Math.ceil(rh),
      yRail: yRailPx,
      btn,
    });
  }, [activeRow]);

  useLayoutEffect(() => {
    let raf = 0;

    const scheduleMeasure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => measureRail());
    };

    scheduleMeasure();

    const nav = navRowRef.current;
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleMeasure)
        : null;
    const rootEl = rootRef.current;
    if (ro && rootEl) ro.observe(rootEl);
    if (ro && nav) {
      ro.observe(nav);
      nav
        .querySelectorAll("[data-bottom-nav-row]")
        .forEach((el) => ro.observe(el));
    }

    const imgs = nav?.querySelectorAll("img") ?? [];
    imgs.forEach((img) => {
      img.addEventListener("load", scheduleMeasure);
    });

    window.addEventListener("resize", scheduleMeasure);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      imgs.forEach((img) => img.removeEventListener("load", scheduleMeasure));
    };
  }, [measureRail, pathname]);

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

  const isMoreActive =
    activeRow === MORE_ROW_KEY ||
    DROPDOWN_NAV.some((item) => pathname.startsWith(item.href));

  const itemShellClass = (active: boolean) =>
    cn(
      "relative flex min-w-[3.25rem] max-w-[4.5rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-1 transition-none",
      active
        ? "text-foreground font-semibold"
        : "text-muted-foreground"
    );

  return (
    <div
      ref={rootRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-visible bg-card px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] lg:hidden",
        className
      )}
    >
      {railGeom.w > 0 && railGeom.h > 0 ? (
        <BottomNavRailSvg
          activeButton={railGeom.btn}
          className="pointer-events-none absolute inset-0 z-10 select-none"
          heightPx={railGeom.h}
          widthPx={railGeom.w}
          yRailPx={railGeom.yRail}
        />
      ) : null}
      <div
        ref={navRowRef}
        className="relative z-20 flex h-[var(--app-bottom-nav-row,4.5rem)] w-full min-h-0 items-stretch justify-around gap-0.5"
      >
        {PRIMARY_NAV.map((item) => {
          const isActive = activeRow === item.href;
          return (
            <div key={item.href} className="flex min-w-0 flex-1">
              <Link
                prefetch={false}
                href={item.href}
                data-bottom-nav-row={item.href}
                className={cn(itemShellClass(isActive), "w-full")}
                aria-current={isActive ? "page" : undefined}
              >
                <Image
                  src={item.iconSrc}
                  alt=""
                  height={isActive ? 28 : 26}
                  width={isActive ? 28 : 26}
                  className="shrink-0"
                />
                <span className="w-full truncate text-center text-[10px] font-semibold leading-tight">
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}

        <div className="relative flex min-w-0 flex-1" ref={dropdownRef}>
          <button
            type="button"
            data-bottom-nav-row={MORE_ROW_KEY}
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            className={cn(
              itemShellClass(isMoreActive || isDropdownOpen),
              "w-full"
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
            <span className="w-full truncate text-center text-[10px] font-semibold leading-tight">
              Menü
            </span>
          </button>
          {isDropdownOpen && (
            <div
              role="menu"
              className="absolute bottom-full right-0 z-50 mb-2 w-48 rounded-xl border border-border bg-card shadow-lg"
            >
              <ul>
                {DROPDOWN_NAV.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        prefetch={false}
                        href={item.href}
                        role="menuitem"
                        className={cn(
                          "flex items-center px-4 py-2.5 text-sm transition-none",
                          isActive
                            ? "bg-suk-brand-soft/40 text-suk-brand-soft-fg font-semibold"
                            : "hover:bg-muted text-foreground"
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
