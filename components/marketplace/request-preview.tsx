"use client";

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
  href: string | null;
  lock: "account" | "mode" | "service" | null;
};

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
  const body = (
    <>
      <p className="text-sm font-bold text-suk-brand">{item.name}</p>
      <p className="mt-1 font-extrabold text-foreground">{item.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {clipText(item.details, 140) || "Açıklama yazılmamış."}
      </p>
      <p className="mt-2 text-sm font-semibold">{item.when}</p>
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
