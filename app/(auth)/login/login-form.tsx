"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { safeNextPath } from "@/lib/safe-next";
import { toast } from "sonner";
import Link from "next/link";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { OAuthSignIn } from "@/components/auth/oauth-signin";
import { PasswordInput } from "@/components/ui/password-input";
import { login } from "./actions";
import { clientLogger } from "@/lib/client-logger";
import { getClientAuthTransientErrorMessage } from "@/lib/auth-flow-client-errors";

type LoginFormProps = {
  referralFromUrl?: string;
  nextPath?: string;
  verified?: boolean;
  loggedOut?: boolean;
};

export function LoginForm({ referralFromUrl, nextPath, verified, loggedOut }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const referralCookieSynced = useRef(false);
  const isLoading = isPending || isSubmitting;

  useEffect(() => {
    if (verified) {
      toast.success("E-postanız başarıyla doğrulandı! Artık giriş yapabilirsiniz.");
    }
    if (verified || loggedOut) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("verified");
      newUrl.searchParams.delete("logout");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [verified, loggedOut]);

  useEffect(() => {
    if (!referralFromUrl || referralCookieSynced.current) return;
    referralCookieSynced.current = true;
    void fetch("/api/referral/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: referralFromUrl }),
    }).catch(() => {});
  }, [referralFromUrl]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("next", safeNextPath(nextPath, "/"));
    startTransition(async () => {
      try {
        const result = await login(formData);
        if (result?.error) {
          toast.error(result.error);
          setIsSubmitting(false);
        }
      } catch (error) {
        clientLogger.error({ message: "login submit failed", error, location: "auth/login-form" });
        toast.error(getClientAuthTransientErrorMessage(error));
        setIsSubmitting(false);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full min-w-0 flex-col space-y-4">
      <input
        id="email"
        name="email"
        type="email"
        placeholder="E-posta"
        className="w-full min-w-0 rounded-xl border border-border bg-background p-3 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60"
        disabled={isLoading}
        required
      />

      <PasswordInput
        id="password"
        name="password"
        placeholder="Şifre"
        disabled={isLoading}
        required
        autoComplete="current-password"
      />

      <Button
        className="w-full transition-all"
        type="submit"
        disabled={isLoading}
        variant="secondary"
        style={{
          opacity: isLoading ? 0.6 : 1,
          cursor: isLoading ? "not-allowed" : "pointer",
          pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Giriş yapılıyor...
          </>
        ) : (
          "E-posta ile Giriş"
        )}
      </Button>

      <p className="text-center text-sm mt-6">
        Şifreni mi unuttun?{" "}
        <Link
          prefetch={false}
          href="/forgot-password"
          className="font-semibold text-suk-brand underline hover:text-suk-brand-hover"
        >
          Şifremi Unuttum
        </Link>
      </p>

      <p className="text-center text-sm mt-3">
        Hesabın yok mu?{" "}
        <Link
          prefetch={false}
          href={
            referralFromUrl
              ? `/create-account?ref=${encodeURIComponent(referralFromUrl)}`
              : "/create-account"
          }
          className="font-semibold text-suk-brand underline hover:text-suk-brand-hover"
        >
          Kayıt Ol
        </Link>
      </p>

      <OAuthSignIn isLoading={isLoading} onLoadingChange={setIsSubmitting} redirectUrl={nextPath} />
    </form>
  );
}
