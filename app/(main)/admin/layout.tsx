import { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, count, eq, gte } from "drizzle-orm";
import { getServerUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import db from "@/db/drizzle";
import {
  teacherApplications,
  listings,
  errorLog,
} from "@/db/schema";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import type { AdminNavBadges } from "@/components/admin/admin-nav-config";
import { getRequestLogger } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Administrative tools and controls",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const user = await getServerUser();
    if (!user) redirect("/login");

    // Centralised admin check: DB role is source of truth, but if the user's
    // email is in ADMIN_EMAILS and the DB role hasn't been synced yet,
    // isAdmin() promotes them automatically.
    const allowed = await isAdmin();
    if (!allowed) redirect("/unauthorized");

    const badges = await loadBadges();

    return (
      <div className="app-main-content-minh bg-gray-50">
        {/* Desktop sidebar (kalıcı) */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-white">
          <AdminSidebar badges={badges} />
        </aside>

        {/* İçerik alanı — mobilde tam genişlik, desktop'ta sidebar kadar offset */}
        <div className="lg:pl-64">
          <AdminTopbar badges={badges} />
          <main className="px-4 sm:px-6 py-6">{children}</main>
        </div>
      </div>
    );
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      // Next.js redirect()/notFound() errors tekrar fırlatılmalı
      throw error;
    }
    (await getRequestLogger({ labels: { route: "admin/layout" } }))
      .error({ message: "admin layout access check failed", error, location: "admin/layout" });
    redirect("/unauthorized");
  }
}

async function loadBadges(): Promise<AdminNavBadges> {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [teacherRow, openListingsRow, errorsRow] = await Promise.all([
      db
        .select({ value: count() })
        .from(teacherApplications)
        .where(eq(teacherApplications.status, "pending")),
      db
        .select({ value: count() })
        .from(listings)
        .where(eq(listings.status, "open")),
      db
        .select({ value: count() })
        .from(errorLog)
        .where(and(gte(errorLog.createdAt, since24h))),
    ]);

    return {
      teacherPending: Number(teacherRow[0]?.value ?? 0),
      openListings: Number(openListingsRow[0]?.value ?? 0),
      errors24h: Number(errorsRow[0]?.value ?? 0),
    };
  } catch (err) {
    (await (await import("@/lib/logger")).getRequestLogger({ labels: { module: "admin/layout" } }))
      .error({ message: "admin badge query failed", error: err, location: "app/(main)/admin/layout" });
    return {};
  }
}
