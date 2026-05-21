import { getProfileDataOnServer } from "@/actions/profile";
import { getProfileAnalytics } from "@/actions/profile-analytics";
import ProfilePageClient from "./profile-page-client";
import { getRequestLogger } from "@/lib/logger";
import { checkSubscriptionStatus } from "@/db/queries";
import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";

export default async function ProfilePage() {
  // Önce auth — login değilse profile fetch'lerini denemek "Giriş yapmanız
  // gerekiyor" exception'ı atıyor ve error_log'a düşüyordu (bkz. log 3445+).
  // Login değilse temiz bir redirect ile login sayfasına gönder.
  const user = await getServerUser();
  if (!user) {
    redirect("/login?next=/profile");
  }

  try {
    const hasAnalyticsAccess = await checkSubscriptionStatus(user.id);
    const [profile, analytics] = await Promise.all([
      getProfileDataOnServer(),
      hasAnalyticsAccess ? getProfileAnalytics() : Promise.resolve(null),
    ]);

    return (
      <ProfilePageClient
        profile={profile}
        allSchools={[]}
        analytics={analytics}
        hasAnalyticsAccess={hasAnalyticsAccess}
      />
    );
  } catch (error) {
    // Server actions içeride redirect atabilir; bunu yakalayıp yeniden
    // fırlatmak Next.js'in redirect'i işlemesi için zorunlu.
    if (isRedirectError(error)) {
      throw error;
    }
    (await getRequestLogger({ labels: { module: "profile/page" } }))
      .error({ message: "fetch profile data failed", error, location: "app/(main)/(protected)/profile/page" });
    return (
      <div className="flex items-center justify-center py-20 px-6 text-center">
        <p className="text-muted-foreground">Profil verileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }
}
