"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { AdminSidebar } from "./admin-sidebar";
import { AdminBreadcrumb } from "./admin-breadcrumb";
import type { AdminNavBadges } from "./admin-nav-config";

type Props = {
  badges?: AdminNavBadges;
};

export function AdminTopbar({ badges }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 sm:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Admin navigasyonu</SheetTitle>
          <AdminSidebar badges={badges} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0">
        <AdminBreadcrumb />
      </div>
    </div>
  );
}
