import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, ChevronRight } from "lucide-react";

import { getMarketplaceStats, getServiceCoverage } from "@/db/queries/marketplace-admin";
import { isAdmin } from "@/lib/admin";
import { getService } from "@/lib/marketplace/catalog";
import { formatPriceTl } from "@/lib/marketplace/format";

export const dynamic = "force-dynamic";

const dayLabel = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function AdminServiceAnalyticsPage() {
  if (!(await isAdmin())) redirect("/unauthorized");
  const [stats, coverage] = await Promise.all([getMarketplaceStats(), getServiceCoverage()]);
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
    { label: "Hizmet alan", value: String(stats.seekers), hint: "Hiç hizmet eklememiş" },
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

      <CoverageTable rows={coverage} />

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

function CoverageTable({ rows }: { rows: Awaited<ReturnType<typeof getServiceCoverage>> }) {
  const services = rows.flatMap((row) => row.services);
  const withProviders = services.filter((service) => service.providers > 0).length;
  const withListings = services.filter((service) => service.active > 0 || service.past > 0).length;

  return (
    <section className="rounded-xl border bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">Kategoriler</h2>
      <p className="mt-1 text-xs text-gray-500">
        {withProviders} hizmette hizmet veren var, {withListings} hizmette ilan var. Bir kişi aynı kategorideki birden
        fazla hizmette tek sayılır. Aktif olanların zamanı henüz dolmamış. Geçmiş, zamanı dolmuş veya kapanmış
        ilanlardır. Reddedilenler bu iki sayıya girmez.
      </p>
      <div className="mt-3">
        <div className="flex items-center gap-3 border-b pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          <span className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">Kategori</span>
          <span className="w-14 shrink-0 text-right sm:w-24">Hizmet veren</span>
          <span className="w-12 shrink-0 text-right sm:w-16">Aktif</span>
          <span className="w-14 shrink-0 text-right sm:w-16">Geçmiş</span>
        </div>
        {rows.map((category) => (
          <details
            key={category.slug}
            open={category.providers > 0 || category.active > 0 || category.past > 0}
            className="group border-b py-2 last:border-b-0"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 text-sm [&::-webkit-details-marker]:hidden">
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
              <span className="min-w-0 flex-1 truncate font-semibold text-gray-900">{category.name}</span>
              <span className="w-14 shrink-0 text-right text-xs text-gray-500 sm:w-24">
                <b className="text-gray-900">{category.providers}</b>
              </span>
              <span className="w-12 shrink-0 text-right text-xs text-gray-500 sm:w-16">
                <b className="text-gray-900">{category.active}</b>
              </span>
              <span className="w-14 shrink-0 text-right text-xs text-gray-500 sm:w-16">
                <b className="text-gray-900">{category.past}</b>
              </span>
            </summary>
            <ul className="mt-1 space-y-1 pl-7">
              {category.services.map((service) => (
                <li key={service.slug} className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="min-w-0 flex-1 truncate">{service.name}</span>
                  <span className="w-14 shrink-0 text-right sm:w-24">{service.providers}</span>
                  <span className="w-12 shrink-0 text-right sm:w-16">{service.active}</span>
                  <span className="w-14 shrink-0 text-right sm:w-16">{service.past}</span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
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
