"use client";

import { useState } from "react";
import { auth } from "@/app/firebase-client";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // veya başka toast kütüphanesi

// Basit bir hata dönüştürme fonksiyonu
function getFriendlyFirebaseError(code: string) {
  switch (code) {
    case "auth/invalid-email":
      return "Geçersiz e-posta adresi. Lütfen doğru formatta girin.";
    case "auth/user-not-found":
      return "Bu e-posta ile kayıtlı kullanıcı bulunamadı.";
    case "auth/wrong-password":
      return "Yanlış şifre. Lütfen tekrar deneyin.";
    default:
      return "Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string>("");

  const handleEmailLogin = async () => {
    setFormError("");
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCred.user.getIdToken();

      // Cookie'ye token koyma
      const res = await fetch("/api/setToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });
      if (!res.ok) {
        toast.error("Sunucuya bağlanırken bir hata oluştu");
        return;
      }

      router.push("/learn");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code) {
        setFormError(getFriendlyFirebaseError(err.code));
      } else {
        setFormError("Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    setFormError("");
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const idToken = await userCred.user.getIdToken();

      const res = await fetch("/api/setToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });
      if (!res.ok) {
        toast.error("Sunucuya bağlanırken bir hata oluştu");
        return;
      }

      router.push("/learn");
    } catch (err: any) {
      console.error("Google Login error:", err);
      if (err.code) {
        setFormError(getFriendlyFirebaseError(err.code));
      } else {
        setFormError("Google ile giriş sırasında bir hata oluştu.");
      }
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* Kart */}
      <div className="w-full max-w-sm bg-white/30 backdrop-blur-lg rounded-3xl shadow-xl p-6 mx-4">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-600">Giriş Yap</h1>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Şifre"
            className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {formError && <p className="text-red-500 text-sm">{formError}</p>}
        </div>

        <div className="mt-5 space-y-3">
          <Button
            onClick={handleEmailLogin}
            variant="default"
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 border-0 text-white font-semibold"
          >
            E-posta ile Giriş
          </Button>
          <Button
            onClick={handleGoogleLogin}
            variant="secondaryOutline"
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 bg-white border border-gray-300 font-semibold hover:bg-gray-100"
          >
            <Image
              src="/google-logo.png"
              alt="Google Logo"
              width={20}
              height={20}
              className="object-contain"
            />
            Google ile Giriş
          </Button>
        </div>

        <p className="text-center text-sm mt-6">
          Hesabın yok mu?{" "}
          <a
            href="/signup"
            className="text-green-600 font-semibold underline hover:text-green-500"
          >
            Kayıt Ol
          </a>
        </p>
      </div>
    </div>
  );
}
