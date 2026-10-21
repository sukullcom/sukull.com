"use client";

import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { clipText } from "@/lib/marketplace/format";

export type RequestPreviewItem = {
  id: number;
  name: string;
  title: string;
  details: string;
  when: string;
  place?: string;
  answers?: { prompt: string; answer: string }[];
  href: string | null;
  lock: "account" | "mode" | "service" | null;
};

/** Kartta gösterilen en fazla soru-cevap; tamamı ilan detayında. */
const PREVIEW_ANSWERS = 6;

export function RequestPreviewList({
  items,
  empty,
}: {
  items: RequestPreviewItem[];
  empty: string;
}) {
  const [lock, setLock] = useState<RequestPreviewItem["lock"]>(null);

  if (items.length === 0) {
    return <p className="mk-empty text-sm">{empty}</p>;
  }

  return (
    <>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <PreviewCard item={item} onLocked={() => setLock(item.lock)} />
          </li>
        ))}
      </ul>
      {lock && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl border-2 border-b-[6px] border-border bg-card p-5 shadow-xl" role="dialog" aria-modal="true">
            <LockCopy lock={lock} />
            <Button type="button" variant="default" className="mt-3 w-full" onClick={() => setLock(null)}>
              Kapat
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function PreviewCard({ item, onLocked }: { item: RequestPreviewItem; onLocked: () => void }) {
  const answers = (item.answers ?? []).slice(0, PREVIEW_ANSWERS);
  const body = (
    <>
      <p className="font-extrabold text-foreground">{item.title}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        {item.when}
      </p>
      {item.place && (
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {item.place}
        </p>
      )}
      {answers.length > 0 && (
        <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
          {answers.map((answer) => (
            <div key={answer.prompt}>
              <dt className="text-xs text-muted-foreground">{answer.prompt}</dt>
              <dd className="font-semibold text-foreground">{answer.answer}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {clipText(item.details, 160) || "Açıklama yazılmamış."}
      </p>
      <p className="mt-2 text-xs font-bold text-suk-brand">{item.name}</p>
    </>
  );
  const className = "mk-card-press p-4";
  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={onLocked}>
      {body}
    </button>
  );
}

function LockCopy({ lock }: { lock: NonNullable<RequestPreviewItem["lock"]> }) {
  if (lock === "account") {
    return (
      <>
        <p className="text-lg font-extrabold">Önce hesap oluştur</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          İlanın tamamını görmek için hesap gerekiyor. Hesap ücretsizdir.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild variant="primary">
            <Link href="/create-account">Kayıt ol</Link>
          </Button>
          <Button asChild variant="default">
            <Link href="/login">Giriş yap</Link>
          </Button>
        </div>
      </>
    );
  }
  if (lock === "mode") {
    return (
      <>
        <p className="text-lg font-extrabold">Hizmet ver moduna geç</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          İlanın detayını ve teklif verme ekranını hizmet veren olarak açabilirsin.
        </p>
      </>
    );
  }
  return (
    <>
      <p className="text-lg font-extrabold">Bu hizmet listenizde yok</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Detayı açmak için aynı hizmeti Hizmetlerim&apos;e ekle.
      </p>
      <Button asChild variant="primary" className="mt-4 w-full">
        <Link href="/ayarlar/hizmetlerim">Hizmetlerim</Link>
      </Button>
    </>
  );
}
