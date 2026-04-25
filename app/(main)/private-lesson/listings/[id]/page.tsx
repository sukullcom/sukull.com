import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getListingById,
  getListingWithOffers,
  hasTeacherOfferedOnListing,
  MAX_OFFERS_PER_LISTING,
} from "@/db/queries";
import UserCreditsDisplay from "@/components/user-credits-display";
import { normalizeAvatarUrl } from "@/utils/avatar";
import {
  ArrowLeft,
  Banknote,
  Monitor,
  MapPin,
  Clock,
  Users,
} from "lucide-react";
import { OfferForm } from "./_components/offer-form";
import { OfferList } from "./_components/offer-list";
import { CloseListingButton } from "./_components/close-listing-button";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const listingId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(listingId) || listingId <= 0) notFound();

  const base = await getListingById(listingId);
  if (!base) notFound();

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });
  const isTeacher = userRecord?.role === "teacher";
  const isOwner = base.studentId === user.id;

  // Owner view: full offers payload so they can accept/reject.
  const full = isOwner ? await getListingWithOffers(listingId) : null;
  // Teacher view: surface whether they've already bid so we hide the form.
  const alreadyOffered =
    !isOwner && isTeacher
      ? await hasTeacherOfferedOnListing(listingId, user.id)
      : false;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <Link
        href="/private-lesson/listings"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> İlanlar
      </Link>

      <div className="bg-white border rounded-xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {base.title}
          </h1>
          <StatusBadge status={base.status} />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Image
            src={normalizeAvatarUrl(base.studentAvatar ?? undefined)}
            alt={base.studentName}
            width={28}
            height={28}
            unoptimized={base.studentAvatar?.startsWith("http") ?? false}
            className="rounded-full object-cover w-7 h-7"
          />
          <span>{base.studentName}</span>
          <span className="text-gray-300">•</span>
          <span>{new Date(base.createdAt).toLocaleDateString("tr-TR")}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
            {base.subject}
          </span>
          {base.grade && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
              {base.grade}
            </span>
          )}
        </div>

        <div className="prose prose-sm max-w-none mb-6">
          <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {base.description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t pt-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">
              {formatLessonMode(base.lessonMode)}
            </span>
          </div>
          {(base.city || base.district) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">
                {[base.district, base.city].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          {(base.budgetMin != null || base.budgetMax != null) && (
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">
                {formatBudget(base.budgetMin, base.budgetMax)}
              </span>
            </div>
          )}
          {base.preferredHours && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{base.preferredHours}</span>
            </div>
          )}
          <div className="flex items-center gap-2 col-span-full">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Gelen Teklifler ({full.offers.length})
          </h2>
          {full.offers.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 bg-white">
              <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                Henüz bu ilana teklif gelmedi.
              </p>
            </div>
          ) : (
            <OfferList offers={full.offers} listingStatus={base.status} />
          )}
        </div>
      )}

      {/* Teacher view: teklif ver formu veya durum kartı */}
      {!isOwner && isTeacher && (
        <div className="mt-6">
          {base.status !== "open" ? (
            <div className="bg-white border rounded-xl p-5 text-center">
              <p className="text-sm text-gray-600">
                Bu ilan artık teklif kabul etmiyor.
              </p>
            </div>
          ) : alreadyOffered ? (
            <div className="bg-white border rounded-xl p-5 text-center">
              <p className="text-sm text-gray-600">
                Bu ilana zaten teklif verdiniz. Teklifinizi{" "}
                <Link
                  href="/private-lesson/teacher-dashboard"
                  className="text-green-700 font-medium hover:underline"
                >
                  kontrol panelinden
                </Link>{" "}
                takip edebilirsiniz.
              </p>
            </div>
          ) : base.offerCount >= MAX_OFFERS_PER_LISTING ? (
            <div className="bg-white border rounded-xl p-5 text-center">
              <p className="text-sm text-gray-600">
                Bu ilan maksimum teklif sayısına ulaştı.
              </p>
            </div>
          ) : (
            <OfferForm
              listingId={base.id}
              budgetMin={base.budgetMin}
              budgetMax={base.budgetMax}
            />
          )}
        </div>
      )}

      {!isOwner && !isTeacher && (
        <div className="mt-6 bg-white border rounded-xl p-5 text-center text-sm text-gray-600">
          İlana teklif vermek için eğitmen hesabına sahip olmanız gerekir.
          Öğretmenlere{" "}
          <Link
            href="/private-lesson/teachers"
            className="text-green-700 font-medium hover:underline"
          >
            rehberden
          </Link>{" "}
          doğrudan mesaj gönderebilirsiniz.
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "open" | "closed" | "expired";
}) {
  const styles: Record<typeof status, string> = {
    open: "bg-blue-100 text-blue-700",
    closed: "bg-gray-100 text-gray-600",
    expired: "bg-gray-100 text-gray-500",
  };
  const labels: Record<typeof status, string> = {
    open: "Açık",
    closed: "Kapalı",
    expired: "Süresi Dolmuş",
  };
  return (
    <span
      className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${styles[status]}`}
    >
      {labels[status]}
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
