import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOpenListings, isTeacher } from "@/db/queries";
import UserCreditsDisplay from "@/components/user-credits-display";
import { ListingsFilters } from "./_components/listings-filters";
import { ListingCard } from "./_components/listing-card";
import { Button } from "@/components/ui/button";
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
 *   - eğitmen → "İlanlarım" (giden teklifler)
 */
export default async function ListingsIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const viewerIsTeacher = await isTeacher(user.id);

  const listings = await getOpenListings({
    subject: searchParams.subject || undefined,
    lessonMode: (searchParams.lessonMode as
      | "online"
      | "in_person"
      | "both"
      | undefined) || undefined,
    city: searchParams.city || undefined,
    limit: 50,
    viewerTeacherId: viewerIsTeacher ? user.id : undefined,
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <div className="flex items-start sm:items-center justify-between gap-3 mb-4 flex-col sm:flex-row">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-suk-warning-soft rounded-lg">
              <Megaphone className="h-5 w-5 text-suk-warning-soft-fg" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              İlanlar
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {viewerIsTeacher
              ? "Yayında olan talep ilanları; yalnızca başvurunda seçtiğin ders konularıyla eşleşen ilanlar listelenir. Teklif vermek 1 kredidir; onay sonrası öğrencinin kayıtlı iletişim bilgileri sohbet üzerinden paylaşılır. İlan başına en fazla 4 teklif."
              : "Öğrencilerin özel ders talepleri. İhtiyacını net yaz; en fazla 4 eğitmen sana teklif gönderebilir."}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {!viewerIsTeacher && (
            <Button
              asChild
              variant="primary"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Link
                href="/private-lesson/listings/new"
                className="inline-flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Yeni İlan
              </Link>
            </Button>
          )}
          {!viewerIsTeacher && (
            <Button
              asChild
              variant="primaryOutline"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Link href="/private-lesson/my-listings">İlanlarım</Link>
            </Button>
          )}
          {viewerIsTeacher && (
            <Button asChild variant="primaryOutline" size="sm">
              <Link href="/private-lesson/teacher-dashboard">Eğitmen paneli</Link>
            </Button>
          )}
        </div>
      </div>

      <ListingsFilters
        initialSubject={searchParams.subject ?? ""}
        initialLessonMode={searchParams.lessonMode ?? ""}
        initialCity={searchParams.city ?? ""}
      />

      {listings.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card">
          <Megaphone className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
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
