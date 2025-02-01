"use client";

import { useState } from "react";
import { auth } from "@/app/firebase-client";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function getFriendlyFirebaseError(code: string) {
  switch (code) {
    case "auth/invalid-email":
      return "Geçersiz e-posta adresi. Lütfen doğru formatta girin.";
    case "auth/user-not-found":
      return "Bu e-posta ile kayıtlı kullanıcı bulunamadı.";
    default:
      return "Şifre sıfırlama sırasında bir hata oluştu. Lütfen tekrar deneyin.";
  }
}

export default function PasswordResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    setFormError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      });
      toast.success("Şifre sıfırlama e-postası gönderildi. Lütfen e-postanızı kontrol edin.");
      router.push("/login");
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code) {
        setFormError(getFriendlyFirebaseError(err.code));
      } else {
        setFormError("Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2">
      {/* Left side image */}
      <div className="relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0">
        <Image src="/hero.svg" fill alt="Hero" />
      </div>

      {/* Right side form */}
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-500">
          Şifremi Unuttum
        </h1>
        <div className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {formError && <p className="text-red-500 text-sm">{formError}</p>}
        </div>
        <div className="mt-5 space-y-3">
          <Button
            onClick={handlePasswordReset}
            variant="secondary"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Gönderiliyor..." : "Şifre Sıfırlama E-postası Gönder"}
          </Button>
        </div>

        <p className="text-center text-sm mt-6">
          Giriş yapmayı unuttun mu?{" "}
          <a
            href="/login"
            className="text-green-500 font-semibold underline hover:text-green-500"
          >
            Giriş Yap
          </a>
        </p>
      </div>
    </div>
  );
}
