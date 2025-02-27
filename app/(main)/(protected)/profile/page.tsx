import { getProfileDataOnServer, getAllSchoolsOnServer } from "@/actions/profile";
import ProfilePageClient from "./profile-page-client";

export default async function ProfilePage() {
  try {
    const [profile, schools] = await Promise.all([
      getProfileDataOnServer(),
      getAllSchoolsOnServer(),
    ]);

    return <ProfilePageClient profile={profile} allSchools={schools} />;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Error loading profile data. Please try again later.</p>
      </div>
    );
  }
}
