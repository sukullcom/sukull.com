import { getProfileDataOnServer } from "@/actions/profile";
import { getProfileAnalytics } from "@/actions/profile-analytics";
import ProfilePageClient from "./profile-page-client";
import { getRequestLogger } from "@/lib/logger";

export default async function ProfilePage() {
  try {
    const [profile, analytics] = await Promise.all([
      getProfileDataOnServer(),
      getProfileAnalytics(),
    ]);

    return <ProfilePageClient profile={profile} allSchools={[]} analytics={analytics} />;
  } catch (error) {
    (await getRequestLogger({ labels: { module: "profile/page" } }))
      .error({ message: "fetch profile data failed", error, location: "app/(main)/(protected)/profile/page" });
    return (
      <div className="flex items-center justify-center py-20 px-6 text-center">
        <p className="text-neutral-600">Profil verileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }
}
