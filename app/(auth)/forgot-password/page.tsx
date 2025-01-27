"use client";

import { useState } from "react";
import { auth } from "@/app/firebase-client";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  const handleResetPassword = async () => {
    setLoading(true);
    setInfoMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMessage("Şifre sıfırlama bağlantısı e-postanıza gönderildi.");
    } catch (err: any) {
      console.error("Forgot password error:", err);
      if (err.code === "auth/user-not-found") {
        setInfoMessage("Bu e-posta ile kayıtlı kullanıcı bulunamadı.");
      } else {
        setInfoMessage("İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-4 border rounded">
      <h1 className="text-2xl font-bold mb-6">Şifremi Unuttum</h1>
      <p className="mb-4">
        Şifrenizi sıfırlamak için kayıtlı e-posta adresinizi girin. Size bir bağlantı
        göndereceğiz.
      </p>
      <input
        className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-posta adresi"
        disabled={loading}
      />
      <Button
        onClick={handleResetPassword}
        disabled={loading || !email}
        variant="default"
        className="w-full"
      >
        {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Bağlantısını Gönder"}
      </Button>

      {infoMessage && (
        <p className="text-sm mt-3 text-center text-gray-700">{infoMessage}</p>
      )}

      <div className="text-center mt-4">
        <a
          href="/login"
          className="underline text-sm text-green-500 hover:text-green-600"
        >
          Giriş sayfasına dön
        </a>
      </div>
    </div>
  );
}
