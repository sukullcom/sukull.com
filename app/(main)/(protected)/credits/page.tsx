import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Pazaryeri hizmet paketi | Sukull",
  description:
    "Özel ders pazarında talep ilanı, mesajlaşma kanalı ve teklif süreçleri için kullanılan dijital platform hizmet paketlerini satın alın.",
};

const CreditsPage = () => {
  // Redirect to the new private lesson credits page
  redirect("/private-lesson/credits");
};

export default CreditsPage; 