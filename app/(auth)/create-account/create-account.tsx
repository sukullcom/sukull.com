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

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    if (!username.trim()) {
      toast.error("Lütfen bir kullanıcı adı giriniz");
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      {/* ----- Use the same exact classes as the old design's inputs, or adapt them */}
      <input
        id="username"
        type="text"
        placeholder="Kullanıcı Adı"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
        required
      />
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
      <input
        id="confirmPassword"
        type="password"
        placeholder="Şifre Tekrar"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isLoading}
        required
      />

      {/* Sign up button */}
      <Button
        className="w-full"
        type="submit"
        disabled={isLoading}
        variant="secondary"
      >
        {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
        E-posta İle Kayıt Ol
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
