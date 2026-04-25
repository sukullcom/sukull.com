import { Metadata } from "next";
import { requireApprovedStudent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Öğretmenler | Sukull",
  description: "Alanında uzman öğretmenlerle birebir özel ders al.",
};

/**
 * Oturum gereksinimini `requireApprovedStudent` sağlıyor. Marketplace
 * sonrası öğrenci onay adımı kaldırıldığı için bu fonksiyon artık sadece
 * girişi zorunlu kılıyor; adı geriye dönük uyumluluk için duruyor.
 */
export default async function TeachersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireApprovedStudent();
  return <>{children}</>;
}
