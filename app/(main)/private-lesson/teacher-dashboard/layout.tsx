import { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Eğitmen paneli | Sukull",
  description: "Tekliflerini, kredilerini ve mesajlarını yönet.",
};

/**
 * Onaylı eğitmenler (rol veya başvuru) bu alanı görebilir.
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
