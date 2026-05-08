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

async function fetchSummary(): Promise<Summary | null> {
  const res = await fetch("/api/referral/summary", { credentials: "same-origin" });
  if (!res.ok) return null;
  const data = (await res.json()) as unknown;
  if (
    data &&
    typeof data === "object" &&
    "ok" in data &&
    (data as { ok?: boolean }).ok === true &&
    "inviteUrl" in data
  ) {
    return data as Summary;
  }
  return null;
}

function InviteDialogInner({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchSummary()
      .then((s) => {
        if (!cancelled) {
          setSummary(s);
          if (!s) toast.error("Davet bilgisi yüklenemedi.");
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
      <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        {open ? <InviteDialogInner onClose={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

/** Masaüstü: sol alt köşe (alt gezinme çubuğunun üstünde). */
export function ReferralInviteFab() {
  return (
    <div className="pointer-events-none fixed bottom-24 left-4 z-[35] hidden lg:block">
      <ReferralDialogWithTrigger>
        <Button
          type="button"
          variant="primary"
          size="icon"
          className="pointer-events-auto h-12 w-12 rounded-full shadow-lg"
          aria-label="Arkadaşını davet et"
        >
          <Gift className="h-5 w-5" />
        </Button>
      </ReferralDialogWithTrigger>
    </div>
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
