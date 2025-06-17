import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Kredi Satın Al | Sukull",
  description: "Özel derslerinizi ayırtabilmek için ders kredisi satın alın",
};

const CreditsPage = () => {
  // Redirect to the new private lesson credits page
  redirect("/private-lesson/credits");
};

export default CreditsPage; 