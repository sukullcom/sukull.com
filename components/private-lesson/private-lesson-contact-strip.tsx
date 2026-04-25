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
 * exists (öğrenci kredisi veya öğretmenin teklif kredisi).
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
      <div className="px-3 py-2.5 border-b bg-emerald-50/80 flex items-center gap-2 text-xs text-gray-500">
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
    <div className="border-b bg-gradient-to-r from-emerald-50/90 to-slate-50 px-3 py-2.5 space-y-2">
      <p className="text-[11px] text-gray-500 flex items-start gap-1.5">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600" />
        <span>
          Açık mesaj hattı için iletişim bilgileri. Telefonu görmek için
          profilinde &quot;Telefon&quot; alanını doldurabilirsin; öğretmenler
          başvurudaki numarasından alınır.
        </span>
      </p>
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/90 border border-emerald-100 p-2.5 space-y-1.5">
          <div className="font-semibold text-gray-800 flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> {other.name}
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <a
              href={`mailto:${other.email}`}
              className="truncate text-emerald-700 hover:underline"
            >
              {other.email}
            </a>
          </div>
          {other.phone ? (
            <div className="flex items-center gap-1.5 text-gray-800 font-medium">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <a href={`tel:${other.phone.replace(/\s/g, "")}`} className="hover:underline">
                {other.phone}
              </a>
            </div>
          ) : (
            <p className="text-amber-700/90 text-[11px] pl-5">Kayıtlı telefon yok</p>
          )}
        </div>
        <div className="rounded-lg bg-slate-50/90 border p-2.5 space-y-1 text-gray-500">
          <p className="text-[10px] uppercase tracking-wide">Senin kaydın</p>
          {you.phone ? (
            <p className="text-gray-700 text-xs">
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
