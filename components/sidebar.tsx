"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { SidebarItem } from "./sidebar-item";
import type { SidebarRailButtonBox } from "./sidebar-rail";
import { SidebarRailSvg } from "./sidebar-rail";

import learnIcon from "@/public/learn.svg";
import leaderboardIcon from "@/public/leaderboard_icon.svg";
import questsIcon from "@/public/quests.svg";
import shopIcon from "@/public/shop_icon.svg";
import gameIcon from "@/public/games.svg";
import privateLessonIcon from "@/public/private_lesson.svg";
import studyBuddyIcon from "@/public/study_buddy.svg";
import profileIcon from "@/public/profile.svg";
import { BRAND_MASCOT_PATH } from "@/lib/brand-mascot";

type Props = {
  className?: string;
};

/** Uzun `href` önce eşlensin; `pathname.startsWith('/learn')` ile yanlış eşleme azaltılır. */
const NAV_ITEMS = [
  { label: "Dersler", href: "/learn", iconSrc: learnIcon },
  { label: "Özel Ders", href: "/private-lesson", iconSrc: privateLessonIcon },
  { label: "Oyunlar", href: "/games", iconSrc: gameIcon },
  { label: "Puan Tablosu", href: "/leaderboard", iconSrc: leaderboardIcon },
  { label: "Hedefler", href: "/quests", iconSrc: questsIcon },
  { label: "Mağaza", href: "/shop", iconSrc: shopIcon },
  {
    label: "Çalışma Arkadaşı",
    href: "/study-buddy",
    iconSrc: studyBuddyIcon,
  },
  { label: "Profil", href: "/profile", iconSrc: profileIcon },
] as const;

function resolveActiveSidebarHref(pathname: string): string | null {
  const sortedByLength = [...NAV_ITEMS].sort(
    (a, b) => b.href.length - a.href.length
  );
  const hit = sortedByLength.find(
    ({ href }) =>
      pathname === href || pathname.startsWith(href + "/")
  );
  return hit?.href ?? null;
}

export const Sidebar = ({ className }: Props) => {
  const pathname = usePathname() ?? "";

  const rootRef = useRef<HTMLDivElement>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);

  const activeHref = resolveActiveSidebarHref(pathname);

  const [railGeom, setRailGeom] = useState<{
    w: number;
    h: number;
    xRail: number;
    btn: SidebarRailButtonBox | null;
  }>({
    w: 0,
    h: 0,
    xRail: 240,
    btn: null,
  });

  const measureRail = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const bb = root.getBoundingClientRect();
    const rw = bb.width || root.offsetWidth || 1;
    const rh =
      bb.height || root.offsetHeight || 1;
    /** Sidebar–içerik sınırı: stroke yaklaşık ortalanır (~2 px). */
    const xRailPx = rw - 2;

    let btn: SidebarRailButtonBox | null = null;

    if (activeHref && navScrollRef.current) {
      const rowEl = Array.from(
        navScrollRef.current.querySelectorAll<HTMLElement>(
          "[data-sidebar-row]"
        )
      ).find((el) => el.dataset.sidebarRow === activeHref);
      if (rowEl) {
        const ir = rowEl.getBoundingClientRect();
        const L = ir.left - bb.left;
        const R = ir.right - bb.left;
        const band = ir.height;
        btn = {
          left: L,
          top: ir.top - bb.top,
          right: R,
          bottom: ir.bottom - bb.top,
          /** `rounded-2xl`; üst geometri güvenilirliği */
          rx: Math.min(16, Math.max(8, Math.round(band / 2) - 10)),
        };
      }
    }

    setRailGeom({
      w: Math.ceil(rw),
      h: Math.ceil(rh),
      xRail: xRailPx,
      btn,
    });
  }, [activeHref]);

  useLayoutEffect(() => {
    let raf = 0;

    const scheduleMeasure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => measureRail());
    };

    scheduleMeasure();

    const nav = navScrollRef.current;

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleMeasure)
        : null;
    const rootEl = rootRef.current;
    if (ro && rootEl) ro.observe(rootEl);
    if (ro && nav) {
      ro.observe(nav);
      nav.querySelectorAll("[data-sidebar-row]").forEach((el) => ro.observe(el));
    }

    const imgs = nav?.querySelectorAll("img") ?? [];

    imgs.forEach((img) => {
      img.addEventListener("load", scheduleMeasure);
    });

    nav?.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      nav?.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      imgs.forEach((img) => img.removeEventListener("load", scheduleMeasure));
    };
  }, [measureRail, pathname]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex h-full w-full flex-col overflow-visible bg-background px-4 pb-6 lg:sticky lg:top-0 lg:h-screen lg:w-[256px]",
        className
      )}
    >
      {railGeom.w > 0 && railGeom.h > 0 ? (
        <SidebarRailSvg
          activeButton={railGeom.btn}
          className="pointer-events-none absolute inset-0 z-10 select-none"
          heightPx={railGeom.h}
          widthPx={railGeom.w}
          xRailPx={railGeom.xRail}
        />
      ) : null}
      <Link prefetch={false} href="/learn">
        <div className="relative z-20 flex shrink-0 items-center gap-x-3 pb-7 pl-4 pt-8">
          <Image
            src={BRAND_MASCOT_PATH}
            height={40}
            width={40}
            alt="Sukull"
            className="object-contain"
          />
          <h1 className="text-2xl font-extrabold tracking-wide text-primary">
            Sukull
          </h1>
        </div>
      </Link>

      <div
        ref={navScrollRef}
        className="relative z-20 flex flex-1 flex-col gap-y-2 overflow-y-auto"
      >
        {NAV_ITEMS.map(({ href, label, iconSrc }) => (
          <div key={href} data-sidebar-row={href}>
            <SidebarItem
              active={activeHref !== null ? activeHref === href : undefined}
              label={label}
              href={href}
              iconSrc={iconSrc}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
