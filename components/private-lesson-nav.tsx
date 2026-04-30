"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type PrivateLessonIconKey =
  | "dashboard"
  | "megaphone"
  | "users"
  | "clipboard"
  | "message"
  | "credit"
  | "settings";

export type PrivateLessonNavItem = {
  name: string;
  path: string;
  icon: PrivateLessonIconKey;
};

const ICON_MAP: Record<PrivateLessonIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  megaphone: Megaphone,
  users: Users,
  clipboard: ClipboardList,
  message: MessageCircle,
  credit: CreditCard,
  settings: Settings,
};

/**
 * Client-only nav strip. Accepts already-resolved items (from the
 * server header) and just handles the active-state highlighting using
 * `usePathname`. Keeps the server/client split clean — server does I/O
 * (user + role), client does UX (pathname/highlight).
 */
export function PrivateLessonNav({ items }: { items: PrivateLessonNavItem[] }) {
  const pathname = usePathname() ?? "";

  const isActive = (path: string) => {
    // Special-case dashboards — they should only light up for the
    // exact root path, otherwise nested children would always match.
    if (path === "/private-lesson/teacher-dashboard") return pathname === path;
    if (path === "/private-lesson/listings/new") return pathname === path;
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="mb-4 sm:mb-6 px-3 sm:px-0">
      {/* Mobil: shrink-0 + overflow-x. md+: flex-1 ile profil/öğrenme sekmeleri gibi eşit pay + ikon solda metin sağda */}
      <div className="flex w-full min-w-0 flex-nowrap gap-0.5 overflow-x-auto overscroll-x-contain scroll-smooth border-2 border-gray-200 rounded-2xl p-1 [-webkit-overflow-scrolling:touch] scrollbar-hide snap-x snap-mandatory md:snap-none md:overflow-x-visible">
        {items.map((item) => {
          const active = isActive(item.path);
          const Icon = ICON_MAP[item.icon];
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex max-md:flex-none max-md:shrink-0 max-md:snap-start max-md:whitespace-nowrap md:flex-1 md:min-w-0 md:whitespace-normal items-center justify-center gap-1.5 rounded-xl py-2.5 px-2.5 sm:px-3 text-xs sm:text-sm transition-all md:px-2 ${
                active
                  ? "bg-gray-100 text-gray-800 font-bold"
                  : "text-gray-500 hover:text-gray-700 font-medium"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words text-left">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
