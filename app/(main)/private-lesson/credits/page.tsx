import { Metadata } from "next";
import { getServerUser } from "@/lib/auth";
import { isApprovedStudent } from "@/db/queries";
import { redirect } from "next/navigation";
import CreditPurchase from "@/components/credit-purchase";

export const metadata: Metadata = {
  title: "Kredi Satın Al | Sukull",
  description: "Özel derslerinizi ayırtabilmek için ders kredisi satın alın",
};

const StudentCreditsPage = async () => {
  const user = await getServerUser();
  
  if (!user) {
    redirect("/login");
  }
  
  // Check if user is an approved student
  const isStudent = await isApprovedStudent(user.id);
  
  if (!isStudent) {
    redirect("/private-lesson");
  }

  return <CreditPurchase />;
};

export default StudentCreditsPage; 