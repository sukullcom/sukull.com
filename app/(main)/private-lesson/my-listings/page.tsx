import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { getMyListings } from "@/db/queries";
import UserCreditsDisplay from "@/components/user-credits-display";
import { ListingCard } from "../listings/_components/listing-card";
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
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClipboardList className="h-5 w-5 text-orange-700" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              İlanlarım
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            Oluşturduğun talep ilanları ve bu ilanlara gelen teklifler.
          </p>
        </div>
        <Link
          href="/private-lesson/listings/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni İlan
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 bg-white">
          <ClipboardList className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">Henüz bir ilan oluşturmadın.</p>
          <Link
            href="/private-lesson/listings/new"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            İlk İlanını Oluştur
          </Link>
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
