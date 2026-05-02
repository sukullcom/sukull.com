"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, User, AlertCircle, Loader2 } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";

type Contact = {
  you: { name: string; email: string; phone: string | null };
  other: { name: string; email: string; phone: string | null };
};

/**
 * Shows the counterparty's phone + email after a message_unlocks row
 * exists (öğrenci kredisi veya eğitmenin teklif kredisi).
 */
export function PrivateLessonContactStrip({ chatId }: { chatId: number }) {
  const [data, setData] = useState<Contact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/private-lesson/messages/${chatId}/contact`,
          { cache: "no-store" },
        );
        const json = (await res.json().catch(() => ({}))) as {
          contact?: Contact;
          error?: string;
        };
        if (!res.ok) {
          if (cancelled) return;
          setError(json.error || "İletişim bilgileri yüklenemedi");
          return;
        }
        if (json.contact && !cancelled) setData(json.contact);
      } catch (e) {
        clientLogger.error({
          message: "load contact strip failed",
          error: e,
          location: "PrivateLessonContactStrip",
        });
        if (!cancelled) setError("Ağ hatası");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 border-b bg-suk-brand-soft/80 px-3 py-2.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        İletişim bilgileri yükleniyor…
      </div>
    );
  }
  if (error || !data) {
    return null;
  }

  const { other, you } = data;

  return (
    <div className="space-y-2 border-b bg-gradient-to-r from-suk-brand-soft/90 to-muted/40 px-3 py-2.5">
      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-suk-brand" />
        <span>
          Açık mesaj hattı için iletişim bilgileri. Telefonu görmek için
          profilinde &quot;Telefon&quot; alanını doldurabilirsin; eğitmenler için
          numara eğitmen başvurusundaki kayıttan alınır.
        </span>
      </p>
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        <div className="space-y-1.5 rounded-lg border border-suk-brand/20 bg-card/90 p-2.5">
          <div className="flex items-center gap-1 font-semibold text-foreground">
            <User className="h-3.5 w-3.5" /> {other.name}
          </div>
          <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <a
              href={`mailto:${other.email}`}
              className="truncate text-suk-brand hover:underline"
            >
              {other.email}
            </a>
          </div>
          {other.phone ? (
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <a href={`tel:${other.phone.replace(/\s/g, "")}`} className="hover:underline">
                {other.phone}
              </a>
            </div>
          ) : (
            <p className="pl-5 text-[11px] text-suk-warning-soft-fg">Kayıtlı telefon yok</p>
          )}
        </div>
        <div className="space-y-1 rounded-lg border border-border bg-muted/50 p-2.5 text-muted-foreground">
          <p className="text-[10px] uppercase tracking-wide">Senin kaydın</p>
          {you.phone ? (
            <p className="text-xs text-foreground">
              <Phone className="inline h-3 w-3 mr-1" />
              {you.phone}
            </p>
          ) : (
            <p className="text-[11px]">Telefon eklemedin — ilan formunda veya ileride profilinden ekleyebilirsin.</p>
          )}
        </div>
      </div>
    </div>
  );
}
