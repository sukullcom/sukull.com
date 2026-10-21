import { ForgotPasswordForm } from "./forgot-password";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
      <p className="text-sm font-bold uppercase tracking-wide text-suk-brand">Sukull</p>
      <h1 className="mt-2 text-3xl font-extrabold text-foreground">Şifremi unuttum</h1>
      <p className="mb-6 mt-2 text-sm leading-relaxed text-muted-foreground">
        E-posta adresine sıfırlama bağlantısı gider. Hesap ücretsiz; Sukull ücret almaz.
      </p>
      <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
