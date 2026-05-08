import { Metadata } from "next";
import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreditPurchase from "@/components/credit-purchase";

export const metadata: Metadata = {
  title: "Pazaryeri hizmet paketi | Sukull",
  description:
    "Özel ders pazarında mesajlaşma kanalı ve teklif süreçleri için dijital platform hizmet paketi satın alın.",
};

/**
 * Credits page is the same for students and teachers — both sides
 * spend credits (students to unlock messaging, teachers to submit
 * offers). The old "approved student" gate was removed with the
 * marketplace refactor, so any authenticated user can top up.
 */
const CreditsPage = async () => {
  const user = await getServerUser();
  if (!user) redirect("/login");

  return <CreditPurchase />;
};

export default CreditsPage;
