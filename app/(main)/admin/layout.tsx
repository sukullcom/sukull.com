import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

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
    // isAdmin() promotes them automatically. This makes bootstrapping a
    // fresh admin account "just work" without manual SQL.
    const allowed = await isAdmin();
    if (!allowed) redirect("/unauthorized");

    return (
      <div className="h-full">
        <div className="h-full">{children}</div>
      </div>
    );
  } catch (error) {
    console.error("Admin layout access error:", error);
    redirect("/unauthorized");
  }
}
