import { normalizeReferralCode } from "@/lib/referral-code";
import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: {
    error?: string;
    next?: string;
    ref?: string;
    verified?: string;
    logout?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = searchParams;
  const referralFromUrl =
    normalizeReferralCode(
      typeof searchParams.ref === "string" ? searchParams.ref : "",
    ) ?? undefined;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
      <p className="text-sm font-bold uppercase tracking-wide text-suk-brand">Sukull</p>
      <h1 className="mt-2 text-3xl font-extrabold text-foreground">Giriş yap</h1>
      <p className="mb-6 mt-2 text-sm leading-relaxed text-muted-foreground">
        Hizmet al veya hizmet ver. Hesap ücretsiz; Sukull ücret almaz.
      </p>
      <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
        {error === "logout_failed" && (
          <div className="mb-4 rounded-lg border border-suk-warning-border bg-suk-warning-soft p-3">
            <p className="text-sm text-suk-warning-soft-fg">
              Çıkış işleminde bir sorun oluştu, ancak güvenliğiniz için oturumunuz sonlandırıldı.
            </p>
          </div>
        )}
        <LoginForm
          referralFromUrl={referralFromUrl}
          nextPath={typeof searchParams.next === "string" ? searchParams.next : undefined}
          verified={searchParams.verified === "true"}
          loggedOut={searchParams.logout === "true"}
        />
      </div>
    </div>
  );
}
