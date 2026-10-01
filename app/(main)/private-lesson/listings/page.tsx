import { Suspense } from "react";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { getOpenListings, isTeacher } from "@/db/queries";
import {
  redactListingForPublic,
  shouldRedactListingForPublic,
} from "@/lib/private-lesson-listing-public";
import { ListingsFilters } from "./_components/listings-filters";
import { ListingCard } from "./_components/listing-card";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = {
  subject?: string;
  lessonMode?: string;
  city?: string;
};

/**
 * Açık talep ilanları — misafir ve öğrenci tüm yayındaki ilanları görür
 * (iletişim yok). Onaylı eğitmen: branş eşleşmeli teklif görünümü.
 */
export default async function ListingsIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getServerUser();
  const viewerIsTeacher = user ? await isTeacher(user.id) : false;

  const listings = await getOpenListings({
    subject: searchParams.subject || undefined,
    lessonMode: (searchParams.lessonMode as
      | "online"
      | "in_person"
      | "both"
      | undefined) || undefined,
    city: searchParams.city || undefined,
    limit: 50,
    viewerTeacherId: viewerIsTeacher && user ? user.id : undefined,
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-10">
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
              ? "Yayında olan talep ilanları; yalnızca başvurunda seçtiğin ders konularıyla eşleşen ilanlar listelenir. Teklif ücretsizdir; onay sonrası öğrencinin kayıtlı iletişim bilgileri sohbet üzerinden paylaşılır. İlan başına en fazla 4 teklif."
              : "Yayındaki öğrenci talep ilanları. Açık listede yalnızca şehir, baş harfler, konu, sınıf, başlık, açıklama ve bütçe görünür. İletişim bilgileri sohbet veya teklif sonrası paylaşılır."}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {viewerIsTeacher ? (
            <Button asChild variant="primaryOutline" size="sm">
              <Link href="/private-lesson/teacher-dashboard">Eğitmen paneli</Link>
            </Button>
          ) : (
            <Button asChild variant="primary" size="sm">
              <Link href="/private-lesson/listings/new">İlan aç</Link>
            </Button>
          )}
        </div>
      </div>

      <Suspense
        fallback={
          <div
            className="mb-4 h-12 w-full max-w-2xl animate-pulse rounded-lg border border-border bg-muted/50"
            aria-hidden
          />
        }
      >
        <ListingsFilters
          initialSubject={searchParams.subject ?? ""}
          initialLessonMode={searchParams.lessonMode ?? ""}
          initialCity={searchParams.city ?? ""}
        />
      </Suspense>

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
          {listings.map((l) => {
            const publicPreview = shouldRedactListingForPublic({
              isOwner: Boolean(user && l.studentId === user.id),
              isTeacher: viewerIsTeacher,
            });
            return (
              <ListingCard
                key={l.id}
                listing={publicPreview ? redactListingForPublic(l) : l}
                variant="browse"
                publicPreview={publicPreview}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
