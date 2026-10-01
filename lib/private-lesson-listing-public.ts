import type { ListingRow } from "@/db/queries/listings";

/** "Ahmet Yılmaz" → "A. Y." — public listing browse. */
export function listingDisplayInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  if (parts.length === 1) {
    return `${first.toLocaleUpperCase("tr-TR")}.`;
  }
  const last = parts[parts.length - 1].charAt(0);
  return `${first.toLocaleUpperCase("tr-TR")}. ${last.toLocaleUpperCase("tr-TR")}.`;
}

export function shouldRedactListingForPublic(opts: {
  isOwner: boolean;
  isTeacher: boolean;
  isAdmin?: boolean;
}): boolean {
  return !opts.isOwner && !opts.isTeacher && !opts.isAdmin;
}

/**
 * Misafir / öğrenci açık ilan görünümü: UUID, avatar, tam ad, ilçe,
 * ders tipi, saatler ve teklif sayısı yok.
 */
export function redactListingForPublic(row: ListingRow): ListingRow {
  return {
    id: row.id,
    studentId: "",
    studentName: listingDisplayInitials(row.studentName),
    studentAvatar: null,
    subject: row.subject,
    grade: row.grade,
    title: row.title,
    description: row.description,
    lessonMode: "online",
    city: row.city,
    district: null,
    budgetMin: row.budgetMin,
    budgetMax: row.budgetMax,
    preferredHours: null,
    status: row.status,
    offerCount: 0,
    createdAt: "",
    expiresAt: null,
  };
}
