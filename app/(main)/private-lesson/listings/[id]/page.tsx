import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerUser } from "@/lib/auth";
import { isTeacher } from "@/db/queries/applications";
import {
  getListingById,
  getListingWithOffers,
  hasTeacherOfferedOnListing,
  MAX_OFFERS_PER_LISTING,
  teacherMatchesListingSubjects,
} from "@/db/queries";
import { isAdmin } from "@/lib/admin";
import UserCreditsDisplay from "@/components/user-credits-display";
import { normalizeAvatarUrl } from "@/utils/avatar";
import {
  ArrowLeft,
  Banknote,
  Monitor,
  MapPin,
  Clock,
  Users,
  MessageCircle,
} from "lucide-react";
import { OfferForm } from "./_components/offer-form";
import { OfferList } from "./_components/offer-list";
import { CloseListingButton } from "./_components/close-listing-button";

export const dynamic = "force-dynamic";

function firstSearchParam(
  v: string | string[] | undefined,
): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { yeni?: string | string[] };
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const listingId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(listingId) || listingId <= 0) notFound();

  const base = await getListingById(listingId);
  if (!base) notFound();

  const isOwner = base.studentId === user.id;
  const showNewListingNudge =
    isOwner && firstSearchParam(searchParams?.yeni) === "1";
  const admin = await isAdmin();
  if (
    (base.status === "pending_review" || base.status === "rejected") &&
    !isOwner &&
    !admin
  ) {
    notFound();
  }

  const listingViewerIsTeacher = await isTeacher(user.id);
  const teacherOffered =
    listingViewerIsTeacher && !isOwner
      ? await hasTeacherOfferedOnListing(listingId, user.id)
      : false;

  if (
    base.status === "open" &&
    listingViewerIsTeacher &&
    !isOwner &&
    !(await teacherMatchesListingSubjects(user.id, base.subject, base.grade)) &&
    !teacherOffered
  ) {
    notFound();
  }

  // Owner view: full offers payload so they can accept/reject.
  const full = isOwner ? await getListingWithOffers(listingId) : null;
  // Teacher view: surface whether they've already bid so we hide the form.
  const alreadyOffered =
    !isOwner && listingViewerIsTeacher ? teacherOffered : false;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <Link
        href={
          listingViewerIsTeacher && !isOwner
            ? "/private-lesson/listings"
            : "/private-lesson/my-listings"
        }
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />{" "}
        {listingViewerIsTeacher && !isOwner ? "İlanlar" : "İlanlarım"}
      </Link>

      {showNewListingNudge && (
        <div className="mb-4 rounded-xl border border-suk-payment-ring/35 bg-suk-payment-soft px-4 py-3 text-sm text-suk-payment-soft-fg">
          <div className="flex gap-2">
            <MessageCircle className="h-5 w-5 shrink-0 text-suk-payment mt-0.5" />
            <div className="space-y-2 min-w-0">
              <p>
                <span className="font-semibold">İlanın kaydedildi.</span>{" "}
                Yönetici onayından sonra ilanına uygun eğitmenler teklif
                verebilir; süre talebe ve yoğunluğa göre değişir.
              </p>
              <p>
                Beklemek istemiyorsan şimdiden{" "}
                <Link
                  href="/private-lesson/teachers"
                  className="font-semibold text-suk-brand underline-offset-2 hover:underline"
                >
                  eğitmen rehberinden
                </Link>{" "}
                konuna uygun birine{" "}
                <span className="font-semibold">1 kullanım hakkı</span> ile mesaj
                kilidini açarak doğrudan iletişim kurabilirsin.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {base.title}
          </h1>
          <StatusBadge status={base.status} />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Image
            src={normalizeAvatarUrl(base.studentAvatar ?? undefined)}
            alt={base.studentName}
            width={28}
            height={28}
            unoptimized={base.studentAvatar?.startsWith("http") ?? false}
            className="rounded-full object-cover w-7 h-7"
          />
          <span>{base.studentName}</span>
          <span className="text-border">•</span>
          <span>{new Date(base.createdAt).toLocaleDateString("tr-TR")}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs bg-suk-warning-soft text-suk-warning-soft-fg px-2 py-0.5 rounded-full font-medium">
            {base.subject}
          </span>
          {base.grade && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
              {base.grade}
            </span>
          )}
        </div>

        <div className="prose prose-sm max-w-none mb-6">
          <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
            {base.description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t pt-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground/90">
              {formatLessonMode(base.lessonMode)}
            </span>
          </div>
          {(base.city || base.district) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground/90">
                {[base.district, base.city].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          {(base.budgetMin != null || base.budgetMax != null) && (
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground/90">
                {formatBudget(base.budgetMin, base.budgetMax)}
              </span>
            </div>
          )}
          {base.preferredHours && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground/90">{base.preferredHours}</span>
            </div>
          )}
          <div className="flex items-center gap-2 col-span-full">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground/90">
              {base.offerCount} / {MAX_OFFERS_PER_LISTING} teklif
            </span>
          </div>
        </div>

        {isOwner && base.status === "open" && (
          <div className="mt-4 border-t pt-4">
            <CloseListingButton listingId={base.id} />
          </div>
        )}
      </div>

      {/* Owner view: gelen teklifler */}
      {isOwner && full && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Gelen Teklifler ({full.offers.length})
          </h2>
          {full.offers.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Henüz bu ilana teklif gelmedi.
              </p>
            </div>
          ) : (
            <OfferList offers={full.offers} listingStatus={base.status} />
          )}
        </div>
      )}

      {/* Teacher view: teklif ver formu veya durum kartı */}
      {!isOwner && listingViewerIsTeacher && (
        <div className="mt-6">
          {base.status !== "open" ? (
            <div className="bg-card border rounded-xl p-5 text-center">
              <p className="text-sm text-muted-foreground">
                Bu ilan artık teklif kabul etmiyor.
              </p>
            </div>
          ) : alreadyOffered ? (
            <div className="bg-card border rounded-xl p-5 text-center">
              <p className="text-sm text-muted-foreground">
                Bu ilana zaten teklif verdin. Teklifini{" "}
                <Link
                  href="/private-lesson/teacher-dashboard"
                  className="text-suk-brand font-medium hover:underline"
                >
                  eğitmen panelinden
                </Link>{" "}
                takip edebilirsin.
              </p>
            </div>
          ) : base.offerCount >= MAX_OFFERS_PER_LISTING ? (
            <div className="bg-card border rounded-xl p-5 text-center">
              <p className="text-sm text-muted-foreground">
                Bu ilan maksimum teklif sayısına ulaştı.
              </p>
            </div>
          ) : (
            <>
              {base.offerCount === MAX_OFFERS_PER_LISTING - 1 ? (
                <div className="mb-3 rounded-lg border border-suk-danger-line bg-suk-danger-soft px-3 py-2.5 text-sm text-suk-danger">
                  <span className="font-semibold">
                    Sadece 1 kontenjan kaldı!
                  </span>{" "}
                  ({base.offerCount}/{MAX_OFFERS_PER_LISTING} teklif) Şimdi
                  teklif vermezsen başka bir eğitmen bu fırsatı kapabilir.
                </div>
              ) : base.offerCount >= 2 ? (
                <div className="mb-3 rounded-lg border border-suk-warning-border bg-suk-warning-soft px-3 py-2.5 text-sm text-suk-warning-soft-fg">
                  Bu ilanda şimdiden {base.offerCount} teklif var. Kontenjan
                  dolduğunda yeni teklif kabul edilmez.
                </div>
              ) : null}
              <OfferForm
                listingId={base.id}
                budgetMin={base.budgetMin}
                budgetMax={base.budgetMax}
              />
            </>
          )}
        </div>
      )}

      {!isOwner && !listingViewerIsTeacher && (
        <div className="mt-6 bg-card border rounded-xl p-5 text-center text-sm text-muted-foreground">
          İlana teklif vermek için eğitmen başvurunun onaylanmış olması gerekir.
          Eğitmen{" "}
          <Link
            href="/private-lesson/teachers"
            className="text-suk-brand font-medium hover:underline"
          >
            rehberinden
          </Link>{" "}
          doğrudan mesaj gönderebilirsin.
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-suk-brand-soft text-suk-brand-border",
    closed: "bg-muted text-muted-foreground",
    expired: "bg-muted text-muted-foreground/80",
    pending_review: "bg-suk-warning-soft text-suk-warning-soft-fg",
    rejected: "bg-suk-danger-soft text-suk-danger",
  };
  const labels: Record<string, string> = {
    open: "Yayında",
    closed: "Kapalı",
    expired: "Süresi dolmuş",
    pending_review: "İncelemede",
    rejected: "Reddedildi",
  };
  return (
    <span
      className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
        styles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function formatLessonMode(mode: string): string {
  switch (mode) {
    case "online":
      return "Sadece online";
    case "in_person":
      return "Sadece yüz yüze";
    case "both":
      return "Online & yüz yüze";
    default:
      return mode;
  }
}

function formatBudget(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}–${max}₺`;
  if (min != null) return `${min}₺+`;
  if (max != null) return `≤ ${max}₺`;
  return "Bütçe belirtilmemiş";
}
