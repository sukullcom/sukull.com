"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

export type PrivateLessonIconKey =
  | "dashboard"
  | "megaphone"
  | "users"
  | "clipboard"
  | "message"
  | "credit";

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
      <div className="flex border-2 border-gray-200 rounded-2xl p-1 gap-0.5 overflow-x-auto scrollbar-hide">
        {items.map((item) => {
          const active = isActive(item.path);
          const Icon = ICON_MAP[item.icon];
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs sm:text-sm transition-all whitespace-nowrap min-w-0 ${
                active
                  ? "bg-gray-100 text-gray-800 font-bold"
                  : "text-gray-500 hover:text-gray-700 font-medium"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
