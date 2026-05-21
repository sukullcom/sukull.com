import { Suspense } from "react";
import Image from "next/image";
import { BRAND_MASCOT_DISPLAY_PATH } from "@/lib/brand-mascot";
import { normalizeReferralCode } from "@/lib/referral-code";
import { LoginForm } from "./login-form";

// Add search params type for error handling
interface LoginPageProps {
  searchParams: {
    error?: string;
    next?: string;
    ref?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = searchParams;
  const referralFromUrl =
    normalizeReferralCode(
      typeof searchParams.ref === "string" ? searchParams.ref : "",
    ) ?? undefined;

  return (
    <div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col items-center justify-center p-4 gap-8">
      {/* Main login section */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-10">
        <div className="relative mx-auto aspect-square w-40 shrink-0 sm:w-48 lg:w-56">
          <Image
            src={BRAND_MASCOT_DISPLAY_PATH}
            fill
            alt="Sukull"
            className="object-contain"
            sizes="(max-width: 640px) 160px, (max-width: 1024px) 192px, 224px"
            priority
          />
        </div>

        <div className="w-full min-w-0 max-w-md rounded-3xl border-2 border-border bg-card p-6 shadow-xl sm:p-7">
          <h1 className="mb-6 text-center text-3xl font-bold text-suk-brand">
            Giriş Yap
          </h1>
          
          {/* Error handling for logout failures */}
          {error === 'logout_failed' && (
            <div className="mb-4 rounded-lg border border-suk-warning-border bg-suk-warning-soft p-3">
              <p className="text-sm text-suk-warning-soft-fg">
                Çıkış işleminde bir sorun oluştu, ancak güvenliğiniz için oturumunuz sonlandırıldı.
              </p>
            </div>
          )}
          
          <Suspense
            fallback={
              <div className="flex h-32 w-full items-center justify-center text-sm text-muted-foreground">
                Yükleniyor…
              </div>
            }
          >
            <LoginForm referralFromUrl={referralFromUrl} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
