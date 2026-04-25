import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import UserCreditsDisplay from "@/components/user-credits-display";
import { ArrowLeft, Megaphone } from "lucide-react";
import { NewListingForm } from "./_components/new-listing-form";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  // Teachers shouldn't post demand listings — they make offers instead.
  // We gate on role only (student/user is fine; teacher is blocked).
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });
  if (userRecord?.role === "teacher") {
    redirect("/private-lesson/listings");
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 pb-10">
      <UserCreditsDisplay className="mb-4" />

      <Link
        href="/private-lesson/listings"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> İlanlar
      </Link>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Megaphone className="h-5 w-5 text-orange-700" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Yeni İlan Oluştur
          </h1>
        </div>
        <p className="text-sm text-gray-600">
          İhtiyacını detaylıca yaz. Bir ilana en fazla 4 öğretmen teklif
          gönderebilir; teklif almak senin için ücretsizdir.
        </p>
      </div>

      <NewListingForm />
    </div>
  );
}
