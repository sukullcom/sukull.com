import { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Öğretmen Paneli | Sukull",
  description: "Öğretmen profilini ve derslerini yönet.",
};

/**
 * Sadece öğretmen rolündeki kullanıcılar bu alanı görebilir.
 * `requireTeacher()` içeride redirect() fırlatır; kendisi bir Next.js
 * navigation sinyali olduğundan try/catch ile YUTULMAMALIDIR
 * (aksi halde sayfa ölü bir "hata" durumunda kalır).
 */
export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireTeacher();
  return <>{children}</>;
}
