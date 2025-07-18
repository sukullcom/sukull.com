import Image from "next/image";
import { ResetPasswordForm } from "./reset-password";

export default function ResetPasswordPage() {
  return (
    <div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2">
      {/* Left side image */}
      <div className="relative aspect-square max-h-[200px] w-full">
          <Image src="/hero.svg" fill alt="Hero" sizes="100vw" />
      </div>

      {/* Right side form container */}
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-500">
          Yeni Şifre
        </h1>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
