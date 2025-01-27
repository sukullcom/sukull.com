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
import { toast } from "sonner";

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
  const [formError, setFormError] = useState("");

  const handleEmailLogin = async () => {
    setFormError("");
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      // If you want to enforce verified emails only:
      // if (!userCred.user.emailVerified) {
      //   toast.error("Email adresiniz doğrulanmamış. Lütfen doğrulayın.");
      //   return;
      // }

      const idToken = await userCred.user.getIdToken();

      // Set token cookie with our session cookie route
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

      // Email verification check if you want
      // if (!userCred.user.emailVerified) { ... }

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
    <div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2">
      <div className="relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0">
        <Image src="/hero.svg" fill alt="Hero" />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-500">
          Giriş Yap
        </h1>
        <div className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Şifre"
            className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {formError && <p className="text-red-500 text-sm">{formError}</p>}
        </div>

        <div className="mt-5 space-y-3">
          <Button onClick={handleEmailLogin} variant="secondary" className="w-full">
            E-posta ile Giriş
          </Button>
          <Button
            onClick={handleGoogleLogin}
            variant="default"
            className="w-full py-5 gap-2"
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
          Şifreni mi unuttun?{" "}
          <a
            href="/forgot-password"
            className="text-green-500 font-semibold underline hover:text-green-500"
          >
            Şifremi Unuttum
          </a>
        </p>

        <p className="text-center text-sm mt-3">
          Hesabın yok mu?{" "}
          <a
            href="/signup"
            className="text-green-500 font-semibold underline hover:text-green-500"
          >
            Kayıt Ol
          </a>
        </p>
      </div>
    </div>
  );
}
