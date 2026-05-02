"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { OAuthSignIn } from "@/components/auth/oauth-signin";

import { signUpWithEmail } from "./actions";
import { getClientAuthTransientErrorMessage } from "@/lib/auth-flow-client-errors";

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

    if (password.length < 8) {
      toast.error("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    try {
      setIsLoading(true);
      const fd = new FormData();
      fd.set("username", username.trim());
      fd.set("email", email.trim());
      fd.set("password", password);
      fd.set("legalAccepted", legalAccepted ? "1" : "0");
      const result = await signUpWithEmail(fd);
      if (!result.ok) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }
      toast.success(
        "Kayıt işlemi başarılı! E-postanıza doğrulama linki gönderildi. Lütfen e-postanızı kontrol edin ve spam klasörünü de kontrol etmeyi unutmayın.",
      );
      router.push("/login");
    } catch (err) {
      toast.error(getClientAuthTransientErrorMessage(err));
      setIsLoading(false);
    }
    // Don't reset isLoading on success - let the redirect happen
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full min-w-0 flex-col space-y-4">
      <input
        id="username"
        type="text"
        placeholder="Kullanıcı Adı"
        className="w-full min-w-0 rounded-xl border border-border bg-background p-3 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        id="email"
        type="email"
        placeholder="E-posta"
        className="w-full min-w-0 rounded-xl border border-border bg-background p-3 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        id="password"
        type="password"
        placeholder="Şifre"
        className="w-full min-w-0 rounded-xl border border-border bg-background p-3 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        id="confirmPassword"
        type="password"
        placeholder="Şifre Tekrar"
        className="w-full min-w-0 rounded-xl border border-border bg-background p-3 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isLoading}
        required
      />

      {/* Legal consent — KVKK + Mesafeli sözleşme gereği açık rıza */}
      <label className="flex w-full min-w-0 cursor-pointer items-start gap-2 text-xs leading-snug text-muted-foreground">
        <input
          id="legalAccepted"
          type="checkbox"
          checked={legalAccepted}
          onChange={(e) => setLegalAccepted(e.target.checked)}
          disabled={isLoading}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-suk-brand focus:ring-2 focus:ring-ring focus:ring-offset-0"
          required
          aria-describedby="legal-consent-description"
        />
        <span id="legal-consent-description">
          <Link
            prefetch={false}
            href="/yasal/kullanim-sartlari"
            target="_blank"
            rel="noopener"
            className="font-medium text-suk-brand hover:underline"
          >
            Kullanım Şartları
          </Link>
          ,{" "}
          <Link
            prefetch={false}
            href="/yasal/gizlilik"
            target="_blank"
            rel="noopener"
            className="font-medium text-suk-brand hover:underline"
          >
            Gizlilik Politikası
          </Link>
          {" "}ve{" "}
          <Link
            prefetch={false}
            href="/yasal/kvkk"
            target="_blank"
            rel="noopener"
            className="font-medium text-suk-brand hover:underline"
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
          className="font-semibold text-suk-brand underline hover:text-suk-brand-hover"
        >
          Giriş Yap
        </Link>
      </p>

      <OAuthSignIn isLoading={isLoading} onLoadingChange={setIsLoading} redirectUrl="/courses" />
    </form>
  );
}
