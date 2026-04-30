import type { Metadata } from "next";
import { TeacherProfileSettingsClient } from "@/components/private-lesson/teacher-profile-settings-client";

export const metadata: Metadata = {
  title: "Eğitmen profili | Sukull",
  description: "Eğitmen bilgilerini güncelle veya öğretmenlikten ayrıl.",
};

export default function TeacherProfileSettingsPage() {
  return <TeacherProfileSettingsClient />;
}
