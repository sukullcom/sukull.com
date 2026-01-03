"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { OAuthSignIn } from "@/components/auth/oauth-signin";
import { login } from "./actions";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  
  // Combined loading state - true if EITHER is true
  const isLoading = isPending || isSubmitting;

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) return;
    
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const next = searchParams.get('next') || '/courses';
    formData.append('next', next);
    
    startTransition(async () => {
      try {
        const result = await login(formData);
        
        if (result?.error) {
          toast.error(result.error);
          setIsSubmitting(false);
        }
        // If no error, server action will redirect
      } catch (error) {
        console.error('Login error:', error);
        toast.error('Giriş yapılırken bir hata oluştu');
        setIsSubmitting(false);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
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
        className="w-full transition-all"
        type="submit"
        disabled={isLoading}
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

      <OAuthSignIn isLoading={isLoading} onLoadingChange={setIsSubmitting} />
    </form>
  );
}
