"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, type AdminNavBadges } from "./admin-nav-config";
import { cn } from "@/lib/utils";

type Props = {
  badges?: AdminNavBadges;
  onNavigate?: () => void;
};

export function AdminSidebar({ badges = {}, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigasyonu"
      className="flex h-full flex-col gap-1 p-3"
    >
      <div className="px-3 pb-3 pt-1">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2 text-lg font-bold text-gray-900"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-lime-500" />
          Sukull Admin
        </Link>
      </div>

      <ul className="flex flex-col gap-0.5">
        {ADMIN_NAV.map(({ href, label, icon: Icon, badgeKey }) => {
          const active =
            href === "/admin"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          const badge = badgeKey ? badges[badgeKey] : undefined;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-lime-50 text-lime-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-lime-600" : "text-gray-400 group-hover:text-gray-600",
                  )}
                />
                <span className="flex-1 truncate">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-bold",
                      badgeKey === "errors24h"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-800",
                    )}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto px-3 pb-2 pt-4 text-[11px] text-gray-400">
        <Link
          href="/learn"
          onClick={onNavigate}
          className="hover:text-gray-600"
        >
          ← Uygulamaya dön
        </Link>
      </div>
    </nav>
  );
}
