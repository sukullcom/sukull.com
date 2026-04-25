import Link from "next/link";
import Image from "next/image";
import { normalizeAvatarUrl } from "@/utils/avatar";
import type { ListingRow } from "@/db/queries/listings";
import { MAX_OFFERS_PER_LISTING } from "@/db/queries/offers";
import { Banknote, Monitor, MapPin, Clock, Users } from "lucide-react";

type Variant = "browse" | "mine";

/**
 * Compact listing summary card. `variant="mine"` drops the student
 * avatar (it's your own listing) and shows status prominently; the
 * default "browse" variant targets the teacher-facing feed.
 */
export function ListingCard({
  listing,
  variant = "browse",
}: {
  listing: ListingRow;
  variant?: Variant;
}) {
  const href = `/private-lesson/listings/${listing.id}`;
  const showStudent = variant === "browse";

  return (
    <Link
      href={href}
      className="block bg-white border rounded-xl p-4 hover:border-orange-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        {showStudent && (
          <Image
            src={normalizeAvatarUrl(listing.studentAvatar ?? undefined)}
            alt={listing.studentName}
            width={40}
            height={40}
            unoptimized={listing.studentAvatar?.startsWith("http") ?? false}
            className="rounded-full object-cover w-10 h-10 shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-1">
              {listing.title}
            </h3>
            <StatusBadge status={listing.status} />
          </div>

          {showStudent && (
            <p className="text-xs text-gray-500 mt-0.5">
              {listing.studentName}
            </p>
          )}

          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
              {listing.subject}
            </span>
            {listing.grade && (
              <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                {listing.grade}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-700 mt-2 line-clamp-2">
            {listing.description}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-gray-600">
            <div className="flex items-center gap-1.5">
              <Monitor className="h-3 w-3 text-gray-400" />
              {formatLessonMode(listing.lessonMode)}
            </div>
            {(listing.city || listing.district) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="truncate">
                  {[listing.district, listing.city].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {(listing.budgetMin != null || listing.budgetMax != null) && (
              <div className="flex items-center gap-1.5">
                <Banknote className="h-3 w-3 text-gray-400" />
                <span>{formatBudget(listing.budgetMin, listing.budgetMax)}</span>
              </div>
            )}
            {listing.preferredHours && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="truncate">{listing.preferredHours}</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5" />
              {listing.offerCount} / {MAX_OFFERS_PER_LISTING} teklif
            </div>
            <span className="text-[11px] text-gray-400">
              {new Date(listing.createdAt).toLocaleDateString("tr-TR")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: ListingRow["status"] }) {
  const styles: Record<ListingRow["status"], string> = {
    open: "bg-blue-100 text-blue-700",
    closed: "bg-gray-100 text-gray-600",
    expired: "bg-gray-100 text-gray-500",
  };
  const labels: Record<ListingRow["status"], string> = {
    open: "Açık",
    closed: "Kapalı",
    expired: "Süresi Dolmuş",
  };
  return (
    <span
      className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatLessonMode(mode: string): string {
  switch (mode) {
    case "online":
      return "Online";
    case "in_person":
      return "Yüz yüze";
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
