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
      className="flex items-center gap-1 text-sm text-muted-foreground"
    >
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Admin</span>
      </Link>
      {current && current.href !== "/admin" && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">{current.label}</span>
        </>
      )}
    </nav>
  );
}
