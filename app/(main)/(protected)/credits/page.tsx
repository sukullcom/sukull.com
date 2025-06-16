import { Metadata } from "next";
import CreditPurchase from "@/components/credit-purchase";

export const metadata: Metadata = {
  title: "Kredi Satın Al | Sukull",
  description: "Özel derslerinizi ayırtabilmek için ders kredisi satın alın",
};

const CreditsPage = () => {
  return <CreditPurchase />;
};

export default CreditsPage; 