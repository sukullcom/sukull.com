"use client";

import { useEffect, useState } from "react";
import { Gift, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Summary = {
  ok: true;
  code: string;
  inviteUrl: string;
  successfulInvites: number;
  referrerRewardPoints: number;
};

async function fetchSummary(): Promise<{ data: Summary | null; errorMessage?: string }> {
  const res = await fetch("/api/referral/summary", { credentials: "same-origin" });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    if (res.status === 503 && raw.error === "migration_required") {
      return {
        data: null,
        errorMessage:
          "Veritabanında davet kolonları yok. Geliştirici: `npm run db:apply -- supabase/migrations/0042_user_referrals.sql` (tercihen DIRECT_URL).",
      };
    }
    if (res.status === 503 && raw.error === "schema_outdated") {
      return {
        data: null,
        errorMessage:
          "Davet özelliği şu an kullanılamıyor (sunucu güncellemesi gerekli). Daha sonra tekrar dene.",
      };
    }
    if (res.status === 404 && raw.error === "no_profile") {
      return { data: null, errorMessage: "Profil veya davet kodu bulunamadı." };
    }
    if (res.status === 429) {
      return { data: null, errorMessage: "Çok sık istek yapıldı; bir dakika sonra tekrar dene." };
    }
    return { data: null, errorMessage: "Davet bilgisi yüklenemedi." };
  }

  if (
    raw &&
    typeof raw === "object" &&
    raw.ok === true &&
    typeof raw.inviteUrl === "string"
  ) {
    return { data: raw as unknown as Summary };
  }
  return { data: null, errorMessage: "Davet bilgisi yüklenemedi." };
}

function InviteDialogInner({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchSummary()
      .then(({ data, errorMessage }) => {
        if (!cancelled) {
          setSummary(data);
          if (!data && errorMessage) toast.error(errorMessage);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copy = async () => {
    if (!summary?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(summary.inviteUrl);
      toast.success("Bağlantı panoya kopyalandı.");
    } catch {
      toast.error("Kopyalama başarısız; bağlantıyı elle seçebilirsin.");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-suk-brand" />
          Arkadaşını davet et
        </DialogTitle>
        <DialogDescription>
          Paylaştığın bağlantıyla kayıt olan her arkadaşın için{" "}
          <strong>tek seferlik</strong> bonus puan kazanırsın (ilk doğrulanmış
          hesap).
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : summary ? (
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
            <p className="text-muted-foreground">Başarılı davet</p>
            <p className="text-2xl font-bold text-foreground">{summary.successfulInvites}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Her davet için +{summary.referrerRewardPoints} puan (okul sıralamasına da yansır).
            </p>
          </div>
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Davet bağlantısı
            </span>
            <p className="break-all rounded-lg border border-border bg-background p-2 text-xs text-foreground">
              {summary.inviteUrl}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" className="flex-1" onClick={() => void copy()}>
              <Link2 className="mr-2 h-4 w-4" />
              Bağlantıyı kopyala
            </Button>
            <Button type="button" variant="linkBrand" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ReferralDialogWithTrigger({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        {open ? <InviteDialogInner onClose={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

/** Masaüstü: sol alt köşe (alt gezinme çubuğunun üstünde). */
export function ReferralInviteFab() {
  const [open, setOpen] = useState(false);
  /**
   * Radix Dialog açıkken tetikleyiciyi `DialogTrigger` ile aynı ağaçta tutmak,
   * üst kapsayıcıya `aria-hidden` uygulanırken butonun odakta kalmasına yol
   * açabiliyor (tarayıcı uyarısı). Tetikleyici kontrollü `open` ile ayrılır.
   *
   * Yatay hiza: sidebar `px-4` + logo container `pl-4` → logo soldan 32 px
   * içerde duruyor. FAB'ı da `left-8` (32 px) yaparak aynı dikey eksene
   * oturtuyoruz; eskiden `left-4` ile kenara çok yapışıktı.
   */
  return (
    <>
      <div className="fixed bottom-24 left-8 z-[35] hidden lg:block">
        <Button
          type="button"
          variant="primary"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label="Arkadaşını davet et"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Gift className="h-5 w-5" />
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          {open ? <InviteDialogInner onClose={() => setOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Mağaza: mobilde de rahat erişim. */
export function ReferralInviteShopCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mb-6 w-full rounded-2xl border-2 border-suk-brand/25 bg-suk-brand-soft/40 p-4",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Arkadaşını davet et</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bağlantını paylaş; arkadaşın kayıt olunca bonus puan kazanırsın.
          </p>
        </div>
        <ReferralDialogWithTrigger>
          <Button type="button" variant="primary" className="shrink-0">
            <Gift className="mr-2 h-4 w-4" />
            Davet bağlantısı
          </Button>
        </ReferralDialogWithTrigger>
      </div>
    </div>
  );
}
