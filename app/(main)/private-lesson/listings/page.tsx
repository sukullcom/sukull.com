import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOpenListings } from "@/db/queries";
import UserCreditsDisplay from "@/components/user-credits-display";
import { ListingsFilters } from "./_components/listings-filters";
import { ListingCard } from "./_components/listing-card";
import { Megaphone, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = {
  subject?: string;
  lessonMode?: string;
  city?: string;
};

/**
 * Shared browse page for student demand posts. Teachers use it to find
 * listings they want to bid on; students use it to see how other
 * people frame their requests (and it's the jump-off to /listings/new).
 *
 * The per-user CTA in the top-right differs by role:
 *   - student → "Yeni İlan Oluştur"
 *   - teacher → "İlanlarım" (outgoing offers history)
 */
export default async function ListingsIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });
  const isTeacher = userRecord?.role === "teacher";

  const listings = await getOpenListings({
    subject: searchParams.subject || undefined,
    lessonMode: (searchParams.lessonMode as
      | "online"
      | "in_person"
      | "both"
      | undefined) || undefined,
    city: searchParams.city || undefined,
    limit: 50,
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <div className="flex items-start sm:items-center justify-between gap-3 mb-4 flex-col sm:flex-row">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Megaphone className="h-5 w-5 text-orange-700" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              İlanlar
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            {isTeacher
              ? "Öğrencilerin talep ilanları. Bir ilana teklif vermek 1 krediye mal olur ve bir ilana en fazla 4 teklif verilebilir."
              : "Öğrencilerin özel ders talepleri. İhtiyacını detaylıca yaz, en fazla 4 öğretmen sana teklif versin."}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {!isTeacher && (
            <Link
              href="/private-lesson/listings/new"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              Yeni İlan
            </Link>
          )}
          {!isTeacher && (
            <Link
              href="/private-lesson/my-listings"
              className="inline-flex items-center justify-center text-sm font-medium text-gray-700 border rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
            >
              İlanlarım
            </Link>
          )}
          {isTeacher && (
            <Link
              href="/private-lesson/teacher-dashboard"
              className="inline-flex items-center justify-center text-sm font-medium text-gray-700 border rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              Kontrol Paneli
            </Link>
          )}
        </div>
      </div>

      <ListingsFilters
        initialSubject={searchParams.subject ?? ""}
        initialLessonMode={searchParams.lessonMode ?? ""}
        initialCity={searchParams.city ?? ""}
      />

      {listings.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 bg-white">
          <Megaphone className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500">
            {searchParams.subject || searchParams.city || searchParams.lessonMode
              ? "Filtrelere uyan ilan bulunamadı."
              : "Şu anda açık ilan bulunmuyor."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} variant="browse" />
          ))}
        </div>
      )}
    </div>
  );
}
