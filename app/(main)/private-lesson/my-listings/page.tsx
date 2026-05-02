import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { getMyListings } from "@/db/queries";
import UserCreditsDisplay from "@/components/user-credits-display";
import { ListingCard } from "../listings/_components/listing-card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const listings = await getMyListings(user.id);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <div className="flex items-start sm:items-center justify-between gap-3 mb-4 flex-col sm:flex-row">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-suk-warning-soft rounded-lg">
              <ClipboardList className="h-5 w-5 text-suk-warning-soft-fg" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              İlanlarım
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Oluşturduğun talep ilanları ve bu ilanlara gelen teklifler. İlanların
            uygunluk kontrolünden geçtiğini unutma; uygunsuz içerik yayından
            kaldırılabilir.
          </p>
        </div>
        <Button asChild variant="primary" size="sm">
          <Link
            href="/private-lesson/listings/new"
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Yeni İlan
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card">
          <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground mb-4">Henüz bir ilan oluşturmadın.</p>
          <Button asChild variant="primary" size="sm">
            <Link
              href="/private-lesson/listings/new"
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              İlk İlanını Oluştur
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} variant="mine" />
          ))}
        </div>
      )}
    </div>
  );
}
