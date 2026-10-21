import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";

import { getMarketplaceStats } from "@/db/queries/marketplace-admin";
import { isAdmin } from "@/lib/admin";
import { getService } from "@/lib/marketplace/catalog";
import { formatPriceTl } from "@/lib/marketplace/format";

export const dynamic = "force-dynamic";

const dayLabel = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function AdminServiceAnalyticsPage() {
  if (!(await isAdmin())) redirect("/unauthorized");
  const stats = await getMarketplaceStats();
  const peak = Math.max(1, ...stats.days.map((day) => day.value));
  const topServiceMax = Math.max(1, ...stats.topServices.map((row) => row.value));
  const topCityMax = Math.max(1, ...stats.topCities.map((row) => row.value));

  const cards: { label: string; value: string; hint?: string }[] = [
    { label: "Toplam ilan", value: String(stats.totalRequests), hint: `Son 7 gün ${stats.created7} · Son 30 gün ${stats.created30}` },
    { label: "İncelemede", value: String(stats.byStatus.pending), hint: stats.avgReviewHours === null ? undefined : `Ortalama inceleme ${stats.avgReviewHours} saat` },
    { label: "Yayında", value: String(stats.byStatus.open) },
    { label: "Reddedilen", value: String(stats.byStatus.rejected), hint: `Ret oranı %${stats.rejectRate}` },
    { label: "Teklif", value: String(stats.quotes), hint: `İlan başına ${stats.avgQuotesPerRequest}` },
    { label: "Kabul edilen teklif", value: String(stats.acceptedQuotes), hint: `Kabul oranı %${stats.acceptRate}` },
    { label: "Ortalama teklif", value: stats.avgPriceTl === null ? "—" : formatPriceTl(stats.avgPriceTl) },
    { label: "Mesaj", value: String(stats.messages) },
    { label: "Hizmet veren", value: String(stats.providers), hint: "En az bir hizmet ekleyen" },
    { label: "Talep oluşturan", value: String(stats.customers) },
    { label: "Yorum", value: String(stats.reviews), hint: stats.avgStars === null ? undefined : `Ortalama ${stats.avgStars}/5` },
    { label: "Süresi dolan", value: String(stats.byStatus.expired) },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-sky-50 p-2">
            <BarChart3 className="h-5 w-5 text-sky-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">İlan analitiği</h1>
            <p className="text-xs text-gray-500">Hizmet pazarındaki talep, teklif ve inceleme sayıları.</p>
          </div>
        </div>
        <Link
          href="/admin/hizmet-ilanlari"
          className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          İnceleme kuyruğu ({stats.byStatus.pending})
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
            {card.hint && <p className="mt-1 text-[11px] text-gray-500">{card.hint}</p>}
          </div>
        ))}
      </div>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Son 14 gün yeni ilan</h2>
        <div className="flex h-40 items-end gap-1.5">
          {stats.days.map((day) => (
            <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-gray-500">{day.value || ""}</span>
              <div
                className="w-full rounded-t bg-emerald-500"
                style={{ height: `${Math.max(2, (day.value / peak) * 112)}px`, opacity: day.value ? 1 : 0.25 }}
                title={`${day.day}: ${day.value}`}
              />
              <span className="text-[10px] text-gray-400">{dayLabel.format(new Date(`${day.day}T00:00:00Z`))}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <BarList
          title="En çok talep edilen hizmetler"
          rows={stats.topServices.map((row) => ({ label: getService(row.slug)?.name ?? row.slug, value: row.value }))}
          max={topServiceMax}
        />
        <BarList
          title="Şehirler"
          rows={stats.topCities.map((row) => ({ label: row.city || "—", value: row.value }))}
          max={topCityMax}
        />
      </div>
    </div>
  );
}

function BarList({ title, rows, max }: { title: string; rows: { label: string; value: number }[]; max: number }) {
  return (
    <section className="rounded-xl border bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">Henüz veri yok.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="text-xs">
              <div className="mb-1 flex justify-between gap-2 text-gray-700">
                <span className="truncate">{row.label}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-sky-500" style={{ width: `${(row.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
