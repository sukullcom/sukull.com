import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { isTeacher } from "@/db/queries/applications";
import { ArrowLeft, Megaphone } from "lucide-react";
import { NewListingForm } from "./_components/new-listing-form";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const user = await getServerUser();
  const viewerIsTeacher = user ? await isTeacher(user.id) : false;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 pb-10">
      <Link
        href={
          user ? "/private-lesson/my-listings" : "/private-lesson/listings"
        }
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />{" "}
        {user ? "İlanlarım" : "İlanlar"}
      </Link>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-suk-warning-soft rounded-lg">
            <Megaphone className="h-5 w-5 text-suk-warning-soft-fg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Öğrenci talep ilanı
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong className="font-semibold text-foreground">Öğrenciler</strong>{" "}
          burada ne öğrenmek istediklerini yazarak ilan açar.{" "}
          <strong className="font-semibold text-foreground">Eğitmenler</strong>{" "}
          ilan açmaz; açık ilanlara teklif verir. İlan ücretsizdir, yayın için
          yönetici onayı gerekir.
        </p>
      </div>

      <NewListingForm viewerIsTeacher={viewerIsTeacher} />
    </div>
  );
}
