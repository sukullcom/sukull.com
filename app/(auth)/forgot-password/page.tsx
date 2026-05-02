import Image from "next/image";
import { ForgotPasswordForm } from "./forgot-password";

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2">
      {/* Left side image */}
      <div className="relative aspect-square max-h-[200px] w-full">
        <Image src="/hero.svg" fill alt="Hero" sizes="100vw" />
      </div>
      {/* Right side form container */}
      <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-suk-brand">
          Şifremi Unuttum
        </h1>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
