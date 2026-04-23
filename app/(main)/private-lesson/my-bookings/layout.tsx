import { Metadata } from "next";
import { requireApprovedStudent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Rezervasyonlarım | Sukull",
  description: "Özel ders rezervasyonlarını yönet.",
};

/**
 * Sadece onaylı öğrenciler bu alanı görebilir. Onay yoksa `/private-lesson/get`
 * başvuru sayfasına yönlendirilir.
 */
export default async function MyBookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireApprovedStudent();
  return <>{children}</>;
}
