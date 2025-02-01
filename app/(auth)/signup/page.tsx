"use client";

import { useState } from "react";
import { auth } from "@/app/firebase-client";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function getFriendlyFirebaseError(code: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Bu e-posta adresi zaten kullanılıyor.";
    case "auth/invalid-email":
      return "Geçersiz e-posta adresi. Lütfen doğru formatta girin.";
    case "auth/weak-password":
      return "Şifreniz çok zayıf. Daha güçlü bir şifre deneyin.";
    default:
      return "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.";
  }
}

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const handleSignup = async () => {
    setFormError("");
    try {
      // 1) Create user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // 2) Send them a verification email (optional)
      await sendEmailVerification(userCred.user);

      // 3) Get ID token to create a session cookie
      const idToken = await userCred.user.getIdToken();

      // 4) Call our custom signup endpoint
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: idToken,
          displayName: displayName.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sunucu hatası. Lütfen tekrar deneyin.");
      }

      // 5) Go to main page
      router.push("/learn");
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code) {
        setFormError(getFriendlyFirebaseError(err.code));
      } else {
        setFormError(err.message || "Bilinmeyen bir hata oluştu.");
      }
    }
  };

  const handleGoogleSignup = async () => {
    setFormError("");
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);

      // Usually Google's email is verified by default.

      const idToken = await userCred.user.getIdToken();
      const userDisplayName = userCred.user.displayName || "";

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: idToken,
          displayName: userDisplayName.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sunucu hatası. Lütfen tekrar deneyin.");
      }

      router.push("/learn");
    } catch (err: any) {
      console.error("Google signup error:", err);
      if (err.code) {
        setFormError(getFriendlyFirebaseError(err.code));
      } else {
        setFormError("Google ile kayıt sırasında bir hata oluştu.");
      }
    }
  };

  return (
    <div className="max-w-[988px] mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center p-4 gap-2">
      {/* Left side image */}
      <div className="relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0">
        <Image src="/hero.svg" fill alt="Hero" />
      </div>

      {/* Right side form */}
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-500">
          Kayıt Ol
        </h1>
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Kullanıcı Adı"
            className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
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
          <Button onClick={handleSignup} variant="secondary" className="w-full">
            E-posta ile Kayıt Ol
          </Button>
          <Button
            onClick={handleGoogleSignup}
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
            Google ile Kayıt Ol
          </Button>
        </div>

        <p className="text-center text-sm mt-6">
          Zaten bir hesabın var mı?{" "}
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
