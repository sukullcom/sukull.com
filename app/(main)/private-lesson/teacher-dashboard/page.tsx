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
  Activity,
  Users,
  Settings,
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
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Eğitmen paneli
        </h1>
        <p className="text-sm text-muted-foreground">
          Tekliflerini, krediyle ödediğin mesaj ve teklif hareketlerini ve açık
          talep ilanlarına erişimi buradan yönet.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          label="Bekleyen Teklif"
          value={buckets.pending ?? 0}
          icon={Handshake}
          tone="warning"
        />
        <SummaryCard
          label="Kabul Edilen"
          value={buckets.accepted ?? 0}
          icon={Activity}
          tone="brand"
        />
        <SummaryCard
          label="Reddedilen"
          value={buckets.rejected ?? 0}
          icon={Users}
          tone="danger"
        />
        <SummaryCard
          label="Kullanılabilir Kredi"
          value={available}
          icon={Wallet}
          tone="payment"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
          href="/private-lesson/teacher-dashboard/settings"
          icon={Settings}
          title="Profil ayarları"
          desc="Bilgilerini güncelle veya öğretmenlikten ayrıl."
        />
      </div>

      <section className="bg-card border rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b bg-muted/50 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Son Tekliflerim</h2>
          <span className="text-xs text-muted-foreground">Son 10 kayıt</span>
        </div>
        {recentOffers.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Henüz teklif vermemişsin.{" "}
            <Link
              href="/private-lesson/listings"
              className="text-suk-brand font-medium hover:underline"
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
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {r.listingTitle ?? "İlan"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.listingSubject ?? ""} •{" "}
                    {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-sm font-semibold text-foreground">
                    {r.priceProposal}₺
                  </div>
                  <OfferStatusBadge status={r.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-card border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/50">
          <h2 className="font-semibold text-foreground">Son Kredi Harcamaları</h2>
        </div>
        {recentSpends.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Henüz kredi harcamadın.
          </div>
        ) : (
          <div className="divide-y">
            {recentSpends.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <div className="text-foreground/90">
                  Teklif gönderimi (ilan #{s.refId ?? "?"})
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="text-xs">
                    {new Date(s.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                  <span className="font-medium text-suk-danger">
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
  tone: "warning" | "brand" | "danger" | "payment";
}) {
  const toneClass: Record<typeof tone, string> = {
    warning:
      "bg-suk-warning-soft text-suk-warning-soft-fg border-suk-warning-border",
    brand: "bg-suk-brand-soft text-suk-brand-border border-suk-brand/25",
    danger: "bg-suk-danger-soft text-suk-danger border-suk-danger-line",
    payment:
      "bg-suk-payment-soft text-suk-payment-soft-fg border-suk-payment-ring/40",
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
      className="bg-card border rounded-xl p-4 hover:border-suk-brand/35 hover:shadow-sm transition-all flex items-start gap-3"
    >
      <div className="p-2 bg-suk-brand-soft rounded-lg shrink-0">
        <Icon className="h-5 w-5 text-suk-brand" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}

function OfferStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-suk-warning-soft text-suk-warning-soft-fg",
    accepted: "bg-suk-brand-soft text-suk-brand-border",
    rejected: "bg-suk-danger-soft text-suk-danger",
    withdrawn: "bg-muted text-muted-foreground",
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
        styles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
