import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import UserCreditsDisplay from "@/components/user-credits-display";
import { ArrowLeft, Megaphone } from "lucide-react";
import { NewListingForm } from "./_components/new-listing-form";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <Link
        href="/private-lesson/my-listings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> İlanlarım
      </Link>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-suk-warning-soft rounded-lg">
            <Megaphone className="h-5 w-5 text-suk-warning-soft-fg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Yeni İlan Oluştur
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Tüm zorunlu alanları eksiksiz doldur. Bir ilana en fazla 4 eğitmen teklif
          gönderebilir; teklif almak senin için ücretsizdir. Teklif veren
          eğitmenler, kaydettiğin cep telefonuna ve ilgili bilgilere sohbet
          üzerinden erişebilir.
        </p>
      </div>

      <NewListingForm />
    </div>
  );
}
