import { getProfileDataOnServer } from "@/actions/profile";
import ProfilePageClient from "./profile-page-client";

export default async function ProfilePage() {
  try {
    const profile = await getProfileDataOnServer();

    return <ProfilePageClient profile={profile} allSchools={[]} />;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Error loading profile data. Please try again later.</p>
      </div>
    );
  }
}
