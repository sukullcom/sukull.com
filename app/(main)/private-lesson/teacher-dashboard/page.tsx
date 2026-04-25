import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/db/drizzle";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  creditUsage,
  listingOffers,
  listings,
  userCredits,
} from "@/db/schema";
import UserCreditsDisplay from "@/components/user-credits-display";
import {
  Handshake,
  Megaphone,
  Wallet,
  Plus,
  Activity,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Teacher-side control panel after the marketplace refactor. Replaces
 * the old bookings/availability/income dashboard with:
 *   - Credit balance + shortcut to /credits.
 *   - Summary of active/pending/accepted/rejected offers.
 *   - Recent offers table (with listing titles) for drill-in.
 *   - Quick links to the listings browse and the message inbox.
 *
 * Layout is render-time SQL-heavy; keep it under the (main) cache
 * boundary. The wallet card itself is a client component so we can
 * live-refresh it after a credit purchase.
 */
export default async function TeacherDashboardPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const [creditsRow, offerBuckets, recentOffers, recentSpends] =
    await Promise.all([
      db.query.userCredits.findFirst({
        where: eq(userCredits.userId, user.id),
        columns: {
          totalCredits: true,
          usedCredits: true,
          availableCredits: true,
        },
      }),
      db
        .select({
          status: listingOffers.status,
          count: sql<number>`count(*)::int`,
        })
        .from(listingOffers)
        .where(eq(listingOffers.teacherId, user.id))
        .groupBy(listingOffers.status),
      db
        .select({
          offerId: listingOffers.id,
          priceProposal: listingOffers.priceProposal,
          status: listingOffers.status,
          createdAt: listingOffers.createdAt,
          listingId: listings.id,
          listingTitle: listings.title,
          listingSubject: listings.subject,
        })
        .from(listingOffers)
        .leftJoin(listings, eq(listings.id, listingOffers.listingId))
        .where(eq(listingOffers.teacherId, user.id))
        .orderBy(desc(listingOffers.createdAt))
        .limit(10),
      db
        .select({
          id: creditUsage.id,
          reason: creditUsage.reason,
          creditsUsed: creditUsage.creditsUsed,
          createdAt: creditUsage.createdAt,
          refId: creditUsage.refId,
        })
        .from(creditUsage)
        .where(
          and(
            eq(creditUsage.userId, user.id),
            eq(creditUsage.reason, "listing_offer"),
          ),
        )
        .orderBy(desc(creditUsage.createdAt))
        .limit(5),
    ]);

  const buckets = {
    pending: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
  } as Record<string, number>;
  for (const row of offerBuckets) {
    buckets[row.status] = Number(row.count ?? 0);
  }

  const available = creditsRow?.availableCredits ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Öğretmen Paneli
        </h1>
        <p className="text-sm text-gray-600">
          Tekliflerini, krediyle ödediğin mesaj/teklif hareketlerini ve aktif
          ilanlara erişimini buradan yönet.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          label="Bekleyen Teklif"
          value={buckets.pending ?? 0}
          icon={Handshake}
          tone="yellow"
        />
        <SummaryCard
          label="Kabul Edilen"
          value={buckets.accepted ?? 0}
          icon={Activity}
          tone="green"
        />
        <SummaryCard
          label="Reddedilen"
          value={buckets.rejected ?? 0}
          icon={Users}
          tone="red"
        />
        <SummaryCard
          label="Kullanılabilir Kredi"
          value={available}
          icon={Wallet}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <QuickLink
          href="/private-lesson/listings"
          icon={Megaphone}
          title="Açık İlanlar"
          desc="Öğrenci talep ilanlarına göz at ve teklif ver."
        />
        <QuickLink
          href="/private-lesson/messages"
          icon={Users}
          title="Mesajlar"
          desc="Öğrencilerden gelen sohbetler."
        />
        <QuickLink
          href="/private-lesson/credits"
          icon={Plus}
          title="Kredi Al"
          desc="Teklif vermek için kredi satın al."
        />
      </div>

      <section className="bg-white border rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Son Tekliflerim</h2>
          <span className="text-xs text-gray-400">Son 10 kayıt</span>
        </div>
        {recentOffers.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Henüz teklif vermemişsin.{" "}
            <Link
              href="/private-lesson/listings"
              className="text-green-700 font-medium hover:underline"
            >
              İlanlara göz at
            </Link>{" "}
            ve ilk teklifini gönder.
          </div>
        ) : (
          <div className="divide-y">
            {recentOffers.map((r) => (
              <Link
                key={r.offerId}
                href={`/private-lesson/listings/${r.listingId}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {r.listingTitle ?? "İlan"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {r.listingSubject ?? ""} •{" "}
                    {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-sm font-semibold text-gray-800">
                    {r.priceProposal}₺
                  </div>
                  <OfferStatusBadge status={r.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Son Kredi Harcamaları</h2>
        </div>
        {recentSpends.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            Henüz kredi harcamadın.
          </div>
        ) : (
          <div className="divide-y">
            {recentSpends.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <div className="text-gray-700">
                  Teklif gönderimi (ilan #{s.refId ?? "?"})
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="text-xs">
                    {new Date(s.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                  <span className="font-medium text-red-600">
                    -{s.creditsUsed}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "yellow" | "green" | "red" | "blue";
}) {
  const toneClass: Record<typeof tone, string> = {
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <div className={`border rounded-xl p-3 ${toneClass[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border rounded-xl p-4 hover:border-green-300 hover:shadow-sm transition-all flex items-start gap-3"
    >
      <div className="p-2 bg-green-50 rounded-lg shrink-0">
        <Icon className="h-5 w-5 text-green-700" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
    </Link>
  );
}

function OfferStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    withdrawn: "bg-gray-100 text-gray-500",
  };
  const labels: Record<string, string> = {
    pending: "Beklemede",
    accepted: "Kabul Edildi",
    rejected: "Reddedildi",
    withdrawn: "Geri Çekildi",
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
