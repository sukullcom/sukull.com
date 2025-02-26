import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    // Same layout container
    <div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2">
      {/* Left side image */}
      <div className="relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0">
        <Image src="/hero.svg" fill alt="Hero" />
      </div>

      {/* Right side form container */}
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-500">
          Giriş Yap
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
