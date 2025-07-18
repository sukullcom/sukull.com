import Image from "next/image";
import { LoginForm } from "./login-form";

// Add search params type for error handling
interface LoginPageProps {
  searchParams: {
    error?: string;
    next?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = searchParams;

  return (
    <div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col items-center justify-center p-4 gap-8">
      {/* Main login section */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-2">
        {/* ----- Left side image */}
        <div className="relative aspect-square max-h-[200px] w-full">
            <Image src="/hero.svg" fill alt="Hero" sizes="100vw" />
        </div>

        {/* -----Right side form container */}
        <div className="w-full max-w-md bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-6">
          <h1 className="text-3xl font-bold text-center mb-6 text-green-500">
            Giriş Yap
          </h1>
          
          {/* Error handling for logout failures */}
          {error === 'logout_failed' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Çıkış işleminde bir sorun oluştu, ancak güvenliğiniz için oturumunuz sonlandırıldı.
              </p>
            </div>
          )}
          
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
