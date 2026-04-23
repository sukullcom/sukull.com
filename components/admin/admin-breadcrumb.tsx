"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { findAdminNavItem } from "./admin-nav-config";

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const current = findAdminNavItem(pathname);

  return (
    <nav
      aria-label="İçerik yolu"
      className="flex items-center gap-1 text-sm text-gray-500"
    >
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 hover:text-gray-800"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Admin</span>
      </Link>
      {current && current.href !== "/admin" && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          <span className="font-medium text-gray-800">{current.label}</span>
        </>
      )}
    </nav>
  );
}
