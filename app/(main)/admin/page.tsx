import { Suspense } from "react";
import { LayoutDashboard } from "lucide-react";
import {
  AdminHealthBand,
  AdminHealthBandSkeleton,
} from "@/components/admin/admin-health-band";
import {
  AdminMetricsBand,
  AdminMetricsBandSkeleton,
} from "@/components/admin/admin-metrics-band";
import {
  AdminActivityBand,
  AdminActivityBandSkeleton,
} from "@/components/admin/admin-activity-band";

/**
 * Admin Dashboard
 *
 * Shell (başlık, bölüm header'ları) anında render edilir. Üç ağır ada
 * (system health, iş metrikleri, son aktiviteler) birbirinden bağımsız
 * <Suspense> sınırları içinde paralel stream edilir — böylece en yavaş
 * sorgu diğer bölümleri bloklamaz.
 *
 * Auth + admin gate: app/(main)/admin/layout.tsx katmanında.
 * Hata yakalayıcı: app/(main)/admin/error.tsx.
 */
export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-7 w-7 text-gray-700" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
      </div>

      <section aria-label="Sistem sağlığı">
        <h2 className="sr-only">Sistem Sağlığı</h2>
        <Suspense fallback={<AdminHealthBandSkeleton />}>
          <AdminHealthBand />
        </Suspense>
      </section>

      <section aria-label="İş metrikleri">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          İş Metrikleri
        </h2>
        <Suspense fallback={<AdminMetricsBandSkeleton />}>
          <AdminMetricsBand />
        </Suspense>
      </section>

      <section aria-label="Son aktiviteler">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Son Aktiviteler
        </h2>
        <Suspense fallback={<AdminActivityBandSkeleton />}>
          <AdminActivityBand />
        </Suspense>
      </section>
    </div>
  );
}
