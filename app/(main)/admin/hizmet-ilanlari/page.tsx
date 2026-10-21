import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, ClipboardCheck } from "lucide-react";

import { REVIEW_TABS, listRequestsForReview, type ReviewTab } from "@/db/queries/marketplace-admin";
import { isAdmin } from "@/lib/admin";
import { getService } from "@/lib/marketplace/catalog";
import { formatPlace, formatWhen, publicCustomerName, requestCode, requestState } from "@/lib/marketplace/format";
import { StatusDot } from "@/components/marketplace/status-dot";
import { ReviewActions } from "./review-actions";

export const dynamic = "force-dynamic";

const TAB_LABELS: Record<ReviewTab, string> = {
  pending: "İncelemede",
  open: "Yayında",
  rejected: "Reddedildi",
  accepted: "Teklif kabul edildi",
  expired: "Süresi dolan",
  all: "Tümü",
};

const dateFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

export default async function AdminServiceRequestsPage({ searchParams }: { searchParams: { durum?: string } }) {
  if (!(await isAdmin())) redirect("/unauthorized");

  const raw = (searchParams.durum ?? "pending") as ReviewTab;
  const tab: ReviewTab = REVIEW_TABS.includes(raw) ? raw : "pending";
  const rows = await listRequestsForReview(tab);
  const now = Date.now();

  return (
    <div className="max-w-6xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-50 p-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hizmet ilanları</h1>
            <p className="text-xs text-gray-500">
              Yeni talepler önce burada bekler. Onaylanınca hizmet verenlere görünür. Reddederken yazdığın not müşteriye
              gösterilir.
            </p>
          </div>
        </div>
        <Link
          href="/admin/hizmet-ilanlari/analitik"
          className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <BarChart3 className="h-4 w-4" />
          İlan analitiği
        </Link>
      </div>

      <div className="mb-4 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-xl border bg-white p-1">
        {REVIEW_TABS.map((item) => (
          <Link
            key={item}
            href={`/admin/hizmet-ilanlari?durum=${item}`}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition-colors ${
              item === tab ? "bg-emerald-100 font-semibold text-emerald-900" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {TAB_LABELS[item]}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">Bu filtreye uygun ilan yok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="w-[220px] px-4 py-2 text-left">İlan</th>
                  <th className="w-[180px] px-4 py-2 text-left">Müşteri</th>
                  <th className="min-w-[280px] px-4 py-2 text-left">Cevaplar ve açıklama</th>
                  <th className="px-4 py-2 text-left">Durum</th>
                  <th className="px-4 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => {
                  const state = requestState({ ...row, now });
                  const contact =
                    row.contactChannel === "phone" ? row.customerPhone ?? "Telefon yok" : row.customerEmail ?? "—";
                  return (
                    <tr key={row.id} className="align-top hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{getService(row.serviceSlug)?.name ?? row.serviceSlug}</p>
                        <p className="mt-0.5 text-xs text-gray-600">{formatPlace(row.neighborhood, row.district, row.city)}</p>
                        <p className="text-xs text-gray-600">{formatWhen(row.timingType, row.scheduledAt)}</p>
                        <p className="mt-1 font-mono text-[10px] text-gray-400">
                          {requestCode(row.id)} · #{row.id}
                        </p>
                        <p className="text-[10px] text-gray-400">{dateFormat.format(row.createdAt)}</p>
                      </td>
                      <td className="space-y-1 px-4 py-3 text-xs text-gray-700">
                        <p className="text-sm font-medium text-gray-900">
                          {publicCustomerName(row.firstName ?? "", row.lastName ?? "", row.customerName)}
                        </p>
                        <p className="break-all">{row.customerEmail ?? "—"}</p>
                        <p>
                          <span className="text-gray-500">Tercih: </span>
                          {row.contactChannel === "phone" ? "Telefon" : "E-posta"} · {contact}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">
                        <ul className="space-y-0.5">
                          {row.answers.map((answer) => (
                            <li key={answer.id}>
                              <span className="text-gray-500">{answer.prompt} </span>
                              <span className="font-medium text-gray-900">{answer.answer}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-2 text-gray-800">
                          {row.details || "Açıklama yok."}
                        </p>
                      </td>
                      <td className="space-y-1 px-4 py-3 text-xs">
                        <StatusDot tone={state.tone} label={state.label} />
                        <p className="text-gray-500">{row.quoteCount}/4 teklif</p>
                        {row.rejectionNote && (
                          <p className="max-w-[200px] rounded-lg bg-red-50 p-2 text-red-800">{row.rejectionNote}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ReviewActions requestId={row.id} status={state.expired ? "expired" : row.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
