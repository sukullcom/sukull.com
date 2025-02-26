import { getProfileDataOnServer, getAllSchoolsOnServer } from "@/actions/profile"
import ProfilePageClient from "./profile-page-client"

// This file is a Server Component by default (no "use client" at the top).
export default async function ProfilePage() {
  // 1) Fetch your profile + schools directly on the server
  const [profile, schools] = await Promise.all([
    getProfileDataOnServer(),
    getAllSchoolsOnServer(),
  ])

  // 2) Pass data to a client component
  return <ProfilePageClient profile={profile} allSchools={schools} />
}
