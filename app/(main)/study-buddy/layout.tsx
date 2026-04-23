import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";

/**
 * Çalışma Arkadaşı (study-buddy) sayfası client-component olarak yazıldığı için
 * auth bilgisi `useEffect` içinde çekiliyor. Bu layout, auth'suz kullanıcılara
 * HTML'in hiç sunulmamasını garanti eden sunucu-taraflı guard'ı sağlar.
 *
 * Not: `/learn` benzeri açık-kurs zorunluluğu yoktur — kullanıcı study-buddy'yi
 * aktif kurs seçmeden de kullanabilmeli; bu nedenle (protected) grubuna dahil
 * EDİLMEDİ.
 */
export default async function StudyBuddyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/login?next=/study-buddy");
  }
  return <>{children}</>;
}
