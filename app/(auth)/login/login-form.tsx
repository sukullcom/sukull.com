"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { OAuthSignIn } from "@/components/auth/oauth-signin";
import { login } from "./actions";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  // Check for email verification success and logout
  useEffect(() => {
    const verified = searchParams.get('verified');
    const logout = searchParams.get('logout');
    
    if (verified === 'true') {
      toast.success("E-postanız başarıyla doğrulandı! Artık giriş yapabilirsiniz.");
    }
    
    // Clean up URL parameters
    if (verified || logout) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('verified');
      newUrl.searchParams.delete('logout');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    
    // Add next parameter to form data
    const next = searchParams.get('next') || '/courses';
    formData.append('next', next);
    
    const result = await login(formData);
    
    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    }
    // If no error, server action will redirect
  };

  return (
    <form action={handleSubmit} className="flex flex-col space-y-4">
      <input
        id="email"
        name="email"
        type="email"
        placeholder="Email"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
        disabled={isLoading}
        required
      />

      <input
        id="password"
        name="password"
        type="password"
        placeholder="Şifre"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
        disabled={isLoading}
        required
      />

      <Button
        className="w-full transition-opacity"
        type="submit"
        disabled={isLoading}
        variant="secondary"
        style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
      >
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Giriş yapılıyor...
          </>
        ) : (
          'E-posta İle Gİrİş'
        )}
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
