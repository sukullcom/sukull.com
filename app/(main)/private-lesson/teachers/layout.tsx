import { Metadata } from "next";
import { requireApprovedStudent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Öğretmenler | Sukull",
  description: "Alanında uzman öğretmenlerle birebir özel ders al.",
};

/**
 * Sadece onaylı öğrenciler bu alanı görebilir. Onay yoksa `/private-lesson/get`
 * başvuru sayfasına yönlendirilir. Ortak wrapper `private-lesson/layout.tsx`
 * katmanında zaten uygulanıyor, burada ek container kullanmıyoruz.
 */
export default async function TeachersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireApprovedStudent();
  return <>{children}</>;
}
