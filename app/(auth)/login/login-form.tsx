"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { OAuthSignIn } from "@/components/auth/oauth-signin";

import { auth } from "@/utils/auth";
import { getAuthError } from "@/utils/auth-errors";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for email verification success
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      toast.success("E-postanız başarıyla doğrulandı! Artık giriş yapabilirsiniz.");
      // Clean up the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('verified');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await auth.signIn(email, password);
      
      // Use window.location.href for a hard navigation to ensure session is picked up
      // Get the next parameter from URL or default to /courses
      const next = searchParams.get('next') || '/courses';
      window.location.href = next;
    } catch (error) {
      console.error("Auth error:", error);
      const { message } = getAuthError(error);
      toast.error(message);
      setIsLoading(false); // Only set loading to false on error
    }
    // Don't set loading to false on success - we're navigating away
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <input
        id="email"
        type="email"
        placeholder="Email"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
      />

      <input
        id="password"
        type="password"
        placeholder="Şifre"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
        E-posta İle Gİrİş
      </Button>

      <p className="text-center text-sm mt-6">
        Şifreni mi unuttun?{" "}
        <Link
          prefetch={false}
          href="/forgot-password"
          className="text-green-500 font-semibold underline hover:text-green-500"
        >
          Şifremi Unuttum
        </Link>
      </p>
      
      <p className="text-center text-sm mt-3">
        E-posta doğrulama linki almadınız mı?{" "}
        <Link
          prefetch={false}
          href="/resend-verification"
          className="text-green-500 font-semibold underline hover:text-green-500"
        >
          Yeniden Gönder
        </Link>
      </p>
      
      <p className="text-center text-sm mt-3">
        Hesabın yok mu?{" "}
        <Link
          prefetch={false}
          href="/create-account"
          className="text-green-500 font-semibold underline hover:text-green-500"
        >
          Kayıt Ol
        </Link>
      </p>

      <OAuthSignIn isLoading={isLoading} onLoadingChange={setIsLoading} />
    </form>
  );
}
