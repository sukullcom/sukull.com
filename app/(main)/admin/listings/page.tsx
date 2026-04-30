import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import db from "@/db/drizzle";
import { listings, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import type { ListingStatus } from "@/db/queries/listings";
import { ListingModerationActions } from "./listing-moderation-actions";

export const dynamic = "force-dynamic";

const VALID_TABS = [
  "pending_review",
  "rejected",
  "open",
  "closed",
  "expired",
  "all",
] as const;

type ListingTab = (typeof VALID_TABS)[number];

/**
 * Admin ilan moderasyonu: yeni ilanlar `pending_review` ile gelir;
 * onaylanınca `open` olur ve eğitmenlere (branş eşleşmesiyle) görünür.
 */
export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const allowed = await isAdmin();
  if (!allowed) redirect("/unauthorized");

  const raw = (searchParams.status ?? "pending_review").toLowerCase();
  const effectiveStatus: ListingTab = VALID_TABS.includes(raw as ListingTab)
    ? (raw as ListingTab)
    : "pending_review";

  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      subject: listings.subject,
      grade: listings.grade,
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
        : eq(listings.status, effectiveStatus as ListingStatus),
    )
    .orderBy(desc(listings.createdAt))
    .limit(200);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-amber-50 rounded-lg">
          <Megaphone className="h-5 w-5 text-amber-800" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Özel Ders İlanları
          </h1>
          <p className="text-xs text-gray-500">
            Yeni ilanlar önce incelemede listelenir; onay sonrası yalnızca ilan
            konusuyla eşleşen eğitmenlere gösterilir.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 mb-4 bg-white border rounded-xl p-1 w-fit max-w-full">
        {VALID_TABS.map((s) => {
          const active = s === effectiveStatus;
          const labels: Record<ListingTab, string> = {
            pending_review: "İncelemede",
            rejected: "Reddedildi",
            open: "Yayında",
            closed: "Kapalı",
            expired: "Süresi Dolan",
            all: "Tümü",
          };
          return (
            <Link
              key={s}
              href={`/admin/listings?status=${s}`}
              className={`px-2.5 sm:px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                active
                  ? "bg-amber-100 text-amber-900 font-semibold"
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2">İlan</th>
                  <th className="text-left px-4 py-2">Öğrenci</th>
                  <th className="text-left px-4 py-2">Konu / Sınıf</th>
                  <th className="text-left px-4 py-2">Teklif</th>
                  <th className="text-left px-4 py-2">Durum</th>
                  <th className="text-left px-4 py-2">Tarih</th>
                  <th className="text-right px-4 py-2">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link
                        href={`/private-lesson/listings/${r.id}`}
                        className="text-amber-800 hover:underline font-medium"
                      >
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {r.studentName ?? r.studentId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      <span className="font-medium">{r.subject}</span>
                      {r.grade ? (
                        <span className="text-gray-500"> · {r.grade}</span>
                      ) : null}
                      {r.city ? (
                        <span className="text-gray-400"> · {r.city}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {r.offerCount}/4
                    </td>
                    <td className="px-4 py-2">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {r.status === "pending_review" ? (
                        <ListingModerationActions listingId={r.id} />
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending_review: "bg-amber-100 text-amber-900",
    open: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-600",
    expired: "bg-red-100 text-red-600",
    rejected: "bg-red-50 text-red-700",
  };
  const labels: Record<string, string> = {
    pending_review: "İncelemede",
    open: "Yayında",
    closed: "Kapalı",
    expired: "Süresi Doldu",
    rejected: "Reddedildi",
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
