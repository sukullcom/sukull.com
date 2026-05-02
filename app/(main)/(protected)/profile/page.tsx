import { getProfileDataOnServer } from "@/actions/profile";
import { getProfileAnalytics } from "@/actions/profile-analytics";
import ProfilePageClient from "./profile-page-client";
import { getRequestLogger } from "@/lib/logger";
import { checkSubscriptionStatus } from "@/db/queries";
import { getServerUser } from "@/lib/auth";

export default async function ProfilePage() {
  try {
    const user = await getServerUser();
    const hasAnalyticsAccess = user ? await checkSubscriptionStatus(user.id) : false;
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
    (await getRequestLogger({ labels: { module: "profile/page" } }))
      .error({ message: "fetch profile data failed", error, location: "app/(main)/(protected)/profile/page" });
    return (
      <div className="flex items-center justify-center py-20 px-6 text-center">
        <p className="text-muted-foreground">Profil verileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }
}
