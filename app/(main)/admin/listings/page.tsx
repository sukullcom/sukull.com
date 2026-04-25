import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import { listings, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Lightweight admin view over the marketplace listings table. The old
 * per-row moderation actions (approve/reject) don't exist in the new
 * flow because listings don't need manual approval — they're created
 * live by students. This page is intentionally read-only so an admin
 * can spot-check abuse; moderation tooling (hide/close as admin) can
 * be layered on later via the existing PATCH endpoint.
 */
export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const allowed = await isAdmin();
  if (!allowed) redirect("/unauthorized");

  const status = (searchParams.status ?? "open").toLowerCase();
  const validStatuses = ["open", "closed", "expired", "all"] as const;
  const effectiveStatus = (validStatuses as readonly string[]).includes(status)
    ? status
    : "open";

  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      subject: listings.subject,
      studentId: listings.studentId,
      studentName: users.name,
      lessonMode: listings.lessonMode,
      city: listings.city,
      status: listings.status,
      offerCount: listings.offerCount,
      createdAt: listings.createdAt,
    })
    .from(listings)
    .leftJoin(users, eq(users.id, listings.studentId))
    .where(
      effectiveStatus === "all"
        ? sql`true`
        : eq(
            listings.status,
            effectiveStatus as "open" | "closed" | "expired",
          ),
    )
    .orderBy(desc(listings.createdAt))
    .limit(200);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-green-50 rounded-lg">
          <Megaphone className="h-5 w-5 text-green-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Özel Ders İlanları
          </h1>
          <p className="text-xs text-gray-500">
            Öğrencilerin yayınladığı talep ilanları.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4 bg-white border rounded-xl p-1 w-fit">
        {(["open", "closed", "expired", "all"] as const).map((s) => {
          const active = s === effectiveStatus;
          const labels: Record<typeof s, string> = {
            open: "Açık",
            closed: "Kapalı",
            expired: "Süresi Dolan",
            all: "Tümü",
          };
          return (
            <Link
              key={s}
              href={`/admin/listings?status=${s}`}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                active
                  ? "bg-green-100 text-green-700 font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {labels[s]}
            </Link>
          );
        })}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Bu filtreye uygun ilan yok.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2">İlan</th>
                <th className="text-left px-4 py-2">Öğrenci</th>
                <th className="text-left px-4 py-2">Ders / Şehir</th>
                <th className="text-left px-4 py-2">Teklif</th>
                <th className="text-left px-4 py-2">Durum</th>
                <th className="text-left px-4 py-2">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link
                      href={`/private-lesson/listings/${r.id}`}
                      className="text-green-700 hover:underline font-medium"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {r.studentName ?? r.studentId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {r.subject}
                    {r.city ? ` • ${r.city}` : ""}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {r.offerCount}/4
                  </td>
                  <td className="px-4 py-2">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-600",
    expired: "bg-red-100 text-red-600",
  };
  const labels: Record<string, string> = {
    open: "Açık",
    closed: "Kapalı",
    expired: "Süresi Doldu",
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
