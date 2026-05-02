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
      description: listings.description,
      subject: listings.subject,
      grade: listings.grade,
      studentId: listings.studentId,
      studentName: users.name,
      studentEmail: users.email,
      studentPhone: users.phone,
      lessonMode: listings.lessonMode,
      city: listings.city,
      district: listings.district,
      budgetMin: listings.budgetMin,
      budgetMax: listings.budgetMax,
      preferredHours: listings.preferredHours,
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
            konusuyla eşleşen eğitmenlere gösterilir. Tabloda öğrencinin
            profilindeki telefon ve e-posta (ilan oluştururken güncellenmiş
            cep) ile ilan metni yer alır; doğrulama için arayabilirsin.
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
            <table className="w-full text-sm min-w-[960px]">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2 w-[200px]">İlan</th>
                  <th className="text-left px-4 py-2 w-[160px]">Öğrenci &amp; iletişim</th>
                  <th className="text-left px-4 py-2 w-[140px]">Ders / yer / bütçe</th>
                  <th className="text-left px-4 py-2 min-w-[200px]">
                    Saatler &amp; açıklama
                  </th>
                  <th className="text-left px-4 py-2">Teklif</th>
                  <th className="text-left px-4 py-2">Durum</th>
                  <th className="text-left px-4 py-2">Tarih</th>
                  <th className="text-right px-4 py-2">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3">
                      <Link
                        href={`/private-lesson/listings/${r.id}`}
                        className="text-amber-800 hover:underline font-medium block"
                      >
                        {r.title}
                      </Link>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        #{r.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 space-y-1">
                      <div className="font-medium text-gray-900">
                        {r.studentName ?? "—"}
                      </div>
                      <div className="text-xs break-all text-gray-600">
                        {r.studentEmail ?? "—"}
                      </div>
                      <div className="text-xs">
                        {r.studentPhone ? (
                          <a
                            href={`tel:${r.studentPhone.replace(/\s/g, "")}`}
                            className="font-mono text-green-800 hover:underline"
                          >
                            {r.studentPhone}
                          </a>
                        ) : (
                          <span className="text-amber-700" title="users.phone boş">
                            Telefon yok
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs space-y-1">
                      <div>
                        <span className="font-medium text-gray-900">
                          {r.subject}
                        </span>
                        {r.grade ? (
                          <span className="text-gray-600"> · {r.grade}</span>
                        ) : (
                          <span className="text-gray-400"> · sınıf yok</span>
                        )}
                      </div>
                      <div className="text-gray-600">
                        {formatLessonMode(r.lessonMode)}
                      </div>
                      <div className="text-gray-600">
                        {[r.district, r.city].filter(Boolean).join(", ") || "—"}
                      </div>
                      <div className="font-medium text-gray-800">
                        {formatBudget(r.budgetMin, r.budgetMax)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 space-y-1.5">
                      <div>
                        <span className="text-gray-500">Saatler: </span>
                        {r.preferredHours?.trim() ? (
                          <span className="text-gray-900">{r.preferredHours}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                      <p className="text-gray-600 leading-snug line-clamp-4 whitespace-pre-wrap">
                        {r.description}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {r.offerCount}/4
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString("tr-TR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
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

function formatLessonMode(mode: string): string {
  switch (mode) {
    case "online":
      return "Online";
    case "in_person":
      return "Yüz yüze";
    case "both":
      return "Online + yüz yüze";
    default:
      return mode;
  }
}

function formatBudget(
  min: number | null,
  max: number | null,
): string {
  if (min != null && max != null) return `${min}–${max} ₺/saat`;
  if (min != null) return `${min} ₺/saat+`;
  if (max != null) return `≤ ${max} ₺/saat`;
  return "Bütçe —";
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
