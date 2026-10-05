"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { signUpWithEmail } from "@/app/(auth)/create-account/actions";
import { isValidTurkeyMobileForProfile } from "@/lib/teacher-profile-mutation";
import { getClientAuthTransientErrorMessage } from "@/lib/auth-flow-client-errors";
import { ContactChannelField } from "@/components/private-lesson/contact-channel-field";
import type { ContactChannel } from "@/lib/private-lesson-contact-channel";

type IdentityGateOptions = {
  /**
   * Öğrenci / ilan sahibi: iletişim için telefon veya e-posta seçer.
   * Eğitmen teklif kapısında kapalı kalır; orada telefon zorunludur.
   */
  studentContactChoice?: boolean;
  presetContactChannel?: ContactChannel | "";
  presetPhone?: string;
};

/**
 * İlan / mesaj / teklif için onboarding’siz pazar kimliği.
 * 401 sonrası çağrılır; hesap açılınca işlemi tekrarlamak için `true` döner.
 */
export function useMarketplaceIdentityGate(options?: IdentityGateOptions) {
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);
  const studentContactChoice = options?.studentContactChoice ?? false;
  const presetContactChannel = options?.presetContactChannel ?? "";
  const presetPhone = options?.presetPhone ?? "";

  const ensureIdentity = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOpen(true);
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    resolverRef.current?.(ok);
    resolverRef.current = null;
    setOpen(false);
  }, []);

  const gate = (
    <MarketplaceIdentityGate
      open={open}
      studentContactChoice={studentContactChoice}
      presetContactChannel={presetContactChannel}
      presetPhone={presetPhone}
      onOpenChange={(next) => {
        if (!next) settle(false);
        else setOpen(true);
      }}
      onSuccess={() => settle(true)}
    />
  );

  return { ensureIdentity, gate };
}

export async function fetchAfterMarketplaceIdentity(
  doFetch: () => Promise<Response>,
  ensureIdentity: () => Promise<boolean>,
): Promise<Response> {
  const first = await doFetch();
  if (first.status !== 401) return first;
  const ok = await ensureIdentity();
  if (!ok) return first;
  return doFetch();
}

function MarketplaceIdentityGate({
  open,
  studentContactChoice,
  presetContactChannel,
  presetPhone,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  studentContactChoice: boolean;
  presetContactChannel: ContactChannel | "";
  presetPhone: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const pathname = usePathname() ?? "/private-lesson";
  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactChannel, setContactChannel] = useState<ContactChannel | "">("");
  const [password, setPassword] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current && studentContactChoice) {
      if (presetContactChannel) setContactChannel(presetContactChannel);
      if (presetPhone) setPhone(presetPhone);
    }
    wasOpenRef.current = open;
  }, [open, studentContactChoice, presetContactChannel, presetPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!name.trim()) {
      toast.error("Lütfen adını gir.");
      return;
    }
    if (!legalAccepted) {
      toast.error(
        "Devam etmek için Kullanım Şartları, Gizlilik Politikası ve KVKK Aydınlatma Metni'ni kabul etmelisin.",
      );
      return;
    }
    if (password.length < 8) {
      toast.error("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (studentContactChoice) {
      if (contactChannel !== "phone" && contactChannel !== "email") {
        toast.error("İletişim için telefon veya e-posta seç.");
        return;
      }
      if (
        contactChannel === "phone" &&
        !isValidTurkeyMobileForProfile(phone)
      ) {
        toast.error("Geçerli bir Türkiye cep telefonu gir (05xx…).");
        return;
      }
    } else if (!isValidTurkeyMobileForProfile(phone)) {
      toast.error("Geçerli bir Türkiye cep telefonu gir (05xx…).");
      return;
    }

    try {
      setIsLoading(true);
      const fd = new FormData();
      fd.set("username", name.trim());
      fd.set("email", email.trim());
      fd.set("password", password);
      fd.set("legalAccepted", "1");
      if (studentContactChoice) {
        fd.set("contactChannel", contactChannel);
        if (contactChannel === "phone") fd.set("phone", phone.trim());
      } else {
        fd.set("phone", phone.trim());
      }
      const result = await signUpWithEmail(fd);
      if (!result.ok) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }
      toast.success("Kimliğin kaydedildi. İşleme devam edebilirsin.");
      setIsLoading(false);
      onSuccess();
    } catch (err) {
      toast.error(getClientAuthTransientErrorMessage(err));
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kısa kimlik</DialogTitle>
          <DialogDescription>
            {studentContactChoice
              ? "Ad, e-posta ve şifre yeter. İletişim için telefon veya e-posta seçersin. Kurs kaydı yok."
              : "Teklif için ad, e-posta, telefon ve şifre yeter. Kurs kaydı yok."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Ad"
            autoComplete="name"
            className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            required
            maxLength={80}
          />
          <input
            type="email"
            placeholder="E-posta"
            autoComplete="email"
            className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          {studentContactChoice ? (
            <ContactChannelField
              value={contactChannel}
              onChange={setContactChannel}
              disabled={isLoading}
            />
          ) : null}
          {studentContactChoice && contactChannel !== "phone" ? null : (
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Cep telefonu (05xx…)"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              required
              maxLength={30}
            />
          )}
          <PasswordInput
            id="marketplace-password"
            placeholder="Şifre (en az 8 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="new-password"
          />
          <label className="flex cursor-pointer items-start gap-2 text-xs leading-snug text-muted-foreground">
            <input
              type="checkbox"
              checked={legalAccepted}
              onChange={(e) => setLegalAccepted(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-suk-brand"
              required
            />
            <span>
              <Link
                prefetch={false}
                href="/yasal/kullanim-sartlari"
                target="_blank"
                rel="noopener"
                className="font-medium text-suk-brand hover:underline"
              >
                Kullanım Şartları
              </Link>
              ,{" "}
              <Link
                prefetch={false}
                href="/yasal/gizlilik"
                target="_blank"
                rel="noopener"
                className="font-medium text-suk-brand hover:underline"
              >
                Gizlilik Politikası
              </Link>{" "}
              ve{" "}
              <Link
                prefetch={false}
                href="/yasal/kvkk"
                target="_blank"
                rel="noopener"
                className="font-medium text-suk-brand hover:underline"
              >
                KVKK Aydınlatma Metni
              </Link>
              &apos;ni okudum ve kabul ediyorum.
            </span>
          </label>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || !legalAccepted}
          >
            {isLoading ? "Kaydediliyor…" : "Devam et"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabın var mı?{" "}
            <Link
              prefetch={false}
              href={loginHref}
              className="font-semibold text-suk-brand underline hover:text-suk-brand-hover"
            >
              Giriş yap
            </Link>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
