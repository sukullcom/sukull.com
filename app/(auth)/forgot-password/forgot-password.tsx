"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

import { auth } from "@/utils/auth";
import { getAuthError } from "@/utils/auth-errors";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await auth.resetPasswordRequest(email);
      toast.success(response.message);
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
      <Button
        className="w-full"
        type="submit"
        disabled={isLoading}
        variant="secondary"
      >
        {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
        Şİfre Sıfırlama E-postası Gönder
      </Button>

      <p className="text-center text-sm mt-6">
        Giriş yapmayı unuttun mu?{" "}
        <Link
          prefetch={false}
          href="/login"
          className="text-green-500 font-semibold underline hover:text-green-500"
        >
          Giriş Yap
        </Link>
      </p>
    </form>
  );
}
