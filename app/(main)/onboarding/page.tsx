import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { getUserProgress } from "@/db/queries";
import { OnboardingForm } from "./onboarding-form";

export const metadata = {
  title: "Seni tanıyalım — Sukull",
  description: "Sınıf / sınav yolunuzu seçin",
};

export default async function OnboardingPage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const up = await getUserProgress();
  if (up?.onboardingCompletedAt) {
    redirect("/courses");
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-800">
          Hoş geldin! Önce sana uygun yolu seçelim
        </h1>
        <p className="text-neutral-500 text-sm mt-2">
          Öğrenci mı, mezun mu hazırlanıyorsun — liste ona göre açılır
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
