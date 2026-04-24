"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { OAuthSignIn } from "@/components/auth/oauth-signin";

import { auth } from "@/utils/auth";
import { getAuthError } from "@/utils/auth-errors";

export function CreateAccountForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Legal consent. Required by KVKK + Mesafeli Sözleşmeler Yönetmeliği:
  // the user must explicitly acknowledge the terms before account
  // creation, not be opt-in by default. Checkbox gates submit.
  const [legalAccepted, setLegalAccepted] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) return;
    
    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    if (!username.trim()) {
      toast.error("Lütfen bir kullanıcı adı giriniz");
      return;
    }
    if (!legalAccepted) {
      toast.error(
        "Devam etmek için Kullanım Şartları, Gizlilik Politikası ve KVKK Aydınlatma Metni'ni kabul etmelisiniz.",
      );
      return;
    }

    try {
      setIsLoading(true);
      await auth.signUp(username, email, password);
      toast.success("Kayıt işlemi başarılı! E-postanıza doğrulama linki gönderildi. Lütfen e-postanızı kontrol edin ve spam klasörünü de kontrol etmeyi unutmayın.");
      router.push("/login");
    } catch (error) {
      const { message } = getAuthError(error);
      toast.error(message);
      setIsLoading(false); // Only reset on error
    }
    // Don't reset isLoading on success - let the redirect happen
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      {/* ----- Use the same exact classes as the old design's inputs, or adapt them */}
      <input
        id="username"
        type="text"
        placeholder="Kullanıcı Adı"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        id="email"
        type="email"
        placeholder="E-posta"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        id="password"
        type="password"
        placeholder="Şifre"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        id="confirmPassword"
        type="password"
        placeholder="Şifre Tekrar"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isLoading}
        required
      />

      {/* Legal consent — KVKK + Mesafeli sözleşme gereği açık rıza */}
      <label className="flex items-start gap-2 text-xs text-slate-600 leading-snug cursor-pointer">
        <input
          id="legalAccepted"
          type="checkbox"
          checked={legalAccepted}
          onChange={(e) => setLegalAccepted(e.target.checked)}
          disabled={isLoading}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          required
          aria-describedby="legal-consent-description"
        />
        <span id="legal-consent-description">
          <Link
            prefetch={false}
            href="/yasal/kullanim-sartlari"
            target="_blank"
            rel="noopener"
            className="text-green-600 font-medium hover:underline"
          >
            Kullanım Şartları
          </Link>
          ,{" "}
          <Link
            prefetch={false}
            href="/yasal/gizlilik"
            target="_blank"
            rel="noopener"
            className="text-green-600 font-medium hover:underline"
          >
            Gizlilik Politikası
          </Link>
          {" "}ve{" "}
          <Link
            prefetch={false}
            href="/yasal/kvkk"
            target="_blank"
            rel="noopener"
            className="text-green-600 font-medium hover:underline"
          >
            KVKK Aydınlatma Metni
          </Link>
          {"'ni okudum, kabul ediyorum."}
        </span>
      </label>

      {/* Sign up button */}
      <Button
        className="w-full transition-all"
        type="submit"
        disabled={isLoading || !legalAccepted}
        variant="secondary"
        style={{ 
          opacity: isLoading ? 0.6 : 1, 
          cursor: isLoading ? 'not-allowed' : 'pointer',
          pointerEvents: isLoading ? 'none' : 'auto' // Prevent ANY clicks during loading
        }}
      >
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Hesap oluşturuluyor...
          </>
        ) : (
          'E-posta ile Kayıt Ol'
        )}
      </Button>

      <p className="text-center text-sm mt-6">
        Zaten bir hesabın var mı?{" "}
        <Link
          prefetch={false}
          href="/login"
          className="text-green-500 font-semibold underline hover:text-green-500"
        >
          Giriş Yap
        </Link>
      </p>

      <OAuthSignIn isLoading={isLoading} onLoadingChange={setIsLoading} redirectUrl="/courses" />
    </form>
  );
}
