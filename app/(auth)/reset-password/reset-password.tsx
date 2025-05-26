"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

import { auth } from "@/utils/auth";
import type { AuthError } from "@supabase/supabase-js";

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Verify that the user has a valid session for password reset
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Invalid or expired reset link. Please request a new password reset.");
        router.push("/forgot-password");
        return;
      }
      
      setIsValidSession(true);
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidSession) {
      toast.error("Invalid session. Please request a new password reset.");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsLoading(true);
      await auth.resetPassword(password);
      toast.success("Your password has been reset successfully.");
      router.push("/login");
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="flex items-center justify-center">
        <Icons.spinner className="h-6 w-6 animate-spin" />
        <span className="ml-2">Validating reset link...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <input
        id="password"
        type="password"
        placeholder="Yeni Şifre"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
      />
      <input
        id="confirmPassword"
        type="password"
        placeholder="Yeni Şifre Tekrar"
        className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
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
        Şİfreyİ Sıfırla
      </Button>
    </form>
  );
}
