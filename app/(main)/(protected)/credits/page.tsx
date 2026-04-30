import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Kredi Satın Al | Sukull",
  description:
    "Özel ders pazarında ilan ve mesajlaşma için kullanılan kredileri satın alın (öğrenci: ilan / mesaj kilidi; eğitmen: teklif).",
};

const CreditsPage = () => {
  // Redirect to the new private lesson credits page
  redirect("/private-lesson/credits");
};

export default CreditsPage; 