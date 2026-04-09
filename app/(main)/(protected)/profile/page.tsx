import { getProfileDataOnServer } from "@/actions/profile";
import ProfilePageClient from "./profile-page-client";

export default async function ProfilePage() {
  try {
    const profile = await getProfileDataOnServer();

    return <ProfilePageClient profile={profile} allSchools={[]} />;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return (
      <div className="flex items-center justify-center py-20 px-6 text-center">
        <p className="text-neutral-600">Profil verileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }
}
