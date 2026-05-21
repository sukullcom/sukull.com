import db from "@/db/drizzle";
import {
  users,
  teacherApplications,
  listings,
  listingOffers,
} from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { UsersRound, Clock, CheckCircle, XCircle, Megaphone, Handshake } from "lucide-react";
import { logger } from "@/lib/logger";

/**
 * Aşağıdaki sorgular `<Suspense>` içinde stream edilir. Herhangi biri fırlatırsa
 * React #419 ("server could not finish this Suspense boundary") tetiklenir —
 * tarayıcıda gürültülü bir log düşer. Her sorguyu küçük catch ile sarıyoruz;
 * tek bir sayım başarısız olursa o kart 0 gösterir, panel diğer rakamlarla
 * stream edilmeye devam eder.
 */
async function safeCount(label: string, fn: () => Promise<{ value: number }[]>) {
  try {
    const r = await fn();
    return r[0]?.value ?? 0;
  } catch (err) {
    logger.error({
      message: "admin metrics count query failed",
      error: err,
      location: "admin/admin-metrics-band",
      fields: { metric: label },
    });
    return 0;
  }
}

export async function AdminMetricsBand() {
  const [
    totalUsersRow,
    teacherPendingRow,
    teacherApprovedRow,
    teacherRejectedRow,
    listingsPendingReviewRow,
    pendingOffersRow,
  ] = await Promise.all([
    safeCount("totalUsers", () => db.select({ value: count() }).from(users)),
    safeCount("teacherPending", () =>
      db
        .select({ value: count() })
        .from(teacherApplications)
        .where(eq(teacherApplications.status, "pending")),
    ),
    safeCount("teacherApproved", () =>
      db
        .select({ value: count() })
        .from(teacherApplications)
        .where(eq(teacherApplications.status, "approved")),
    ),
    safeCount("teacherRejected", () =>
      db
        .select({ value: count() })
        .from(teacherApplications)
        .where(eq(teacherApplications.status, "rejected")),
    ),
    safeCount("listingsPendingReview", () =>
      db
        .select({ value: count() })
        .from(listings)
        .where(eq(listings.status, "pending_review")),
    ),
    safeCount("pendingOffers", () =>
      db
        .select({ value: count() })
        .from(listingOffers)
        .where(eq(listingOffers.status, "pending")),
    ),
  ]);

  const stats = {
    totalUsers: totalUsersRow,
    teacherPending: teacherPendingRow,
    teacherApproved: teacherApprovedRow,
    teacherRejected: teacherRejectedRow,
    listingsPendingReview: listingsPendingReviewRow,
    pendingOffers: pendingOffersRow,
  };

  const metricCards = [
    {
      label: "Toplam Kullanıcı",
      value: stats.totalUsers,
      icon: UsersRound,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Bekleyen Eğitmen",
      value: stats.teacherPending,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    {
      label: "Onaylı Eğitmen",
      value: stats.teacherApproved,
      icon: CheckCircle,
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      label: "İncelemede İlan",
      value: stats.listingsPendingReview,
      icon: Megaphone,
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      label: "Bekleyen Teklif",
      value: stats.pendingOffers,
      icon: Handshake,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "Reddedilen Eğitmen",
      value: stats.teacherRejected,
      icon: XCircle,
      color: "bg-red-50 text-red-700 border-red-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {metricCards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className={`rounded-xl border p-4 ${color}`}>
          <Icon className="h-5 w-5 mb-2 opacity-70" />
          <p className="text-2xl font-bold">{value.toLocaleString("tr-TR")}</p>
          <p className="text-xs font-medium opacity-80 mt-1 leading-tight">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function AdminMetricsBandSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border p-4 bg-muted border-border animate-pulse"
        >
          <div className="h-5 w-5 mb-2 bg-gray-200 rounded" />
          <div className="h-7 w-14 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}
