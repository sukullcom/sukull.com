"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

import { auth } from "@/utils/auth";
import { getAuthError } from "@/utils/auth-errors";
import { getClientAuthTransientErrorMessage } from "@/lib/auth-flow-client-errors";

export function ResendVerificationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await auth.resendVerificationEmail(email);
      toast.success(response.message);
      router.push("/login");
    } catch (error) {
      const { message, type } = getAuthError(error);
      if (type === "Default") {
        toast.error(getClientAuthTransientErrorMessage(error));
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <p className="mb-4 text-center text-sm text-muted-foreground">
        E-posta doğrulama linki almadınız mı? E-posta adresinizi girin ve yeni bir doğrulama linki gönderelim.
      </p>
      
      <input
        id="email"
        type="email"
        placeholder="E-posta"
        className="w-full min-w-0 rounded-xl border border-border bg-background p-3 focus:outline-none focus:ring-2 focus:ring-ring"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
      />
      
      <Button
        className="w-full"
        type="submit"
        disabled={isLoading}
        variant="secondary"
      >
        {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
        Doğrulama E-postası Gönder
      </Button>

      <p className="text-center text-sm mt-6">
        Hesabınızı zaten doğruladınız mı?{" "}
        <Link
          prefetch={false}
          href="/login"
          className="font-semibold text-suk-brand underline hover:text-suk-brand-hover"
        >
          Giriş Yap
        </Link>
      </p>
      
      <p className="text-center text-sm mt-3">
        Hesabınız yok mu?{" "}
        <Link
          prefetch={false}
          href="/create-account"
          className="font-semibold text-suk-brand underline hover:text-suk-brand-hover"
        >
          Kayıt Ol
        </Link>
      </p>
    </form>
  );
} 