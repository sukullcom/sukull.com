"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { acceptQuote, closeServiceRequest, createReview, sendServiceMessage, submitQuote } from "@/actions/marketplace";
import { Button } from "@/components/ui/button";

export function MessageForm({ quoteId }: { quoteId: number }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function send() {
    if (pending || !body.trim()) return;
    setPending(true);
    const result = await sendServiceMessage(quoteId, body);
    setPending(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      <input
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Mesaj yaz"
        maxLength={2000}
        className="mk-input min-w-0 flex-1"
      />
      <Button type="submit" variant="primary" disabled={pending || !body.trim()}>
        Gönder
      </Button>
    </form>
  );
}

export function AcceptQuoteButton({ quoteId, otherQuotes }: { quoteId: number; otherQuotes: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function accept() {
    setPending(true);
    const result = await acceptQuote(quoteId);
    setPending(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Teklif kabul edildi");
    router.refresh();
  }

  if (!confirming) {
    return (
      <Button type="button" variant="primary" className="w-full" onClick={() => setConfirming(true)}>
        Teklifi kabul et
      </Button>
    );
  }
  return (
    <div className="mk-card space-y-3 p-4">
      <p className="text-sm font-semibold">Bu teklifi kabul etmek istediğine emin misin?</p>
      <p className="text-sm text-muted-foreground">
        {otherQuotes > 0
          ? `İlan kapanır, diğer ${otherQuotes} teklif kabul edilmedi olarak işaretlenir. Bu geri alınamaz.`
          : "İlan kapanır ve yeni teklif gelmez. Bu geri alınamaz."}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondaryOutline" disabled={pending} onClick={() => setConfirming(false)}>
          Vazgeç
        </Button>
        <Button type="button" variant="primary" disabled={pending} onClick={accept}>
          {pending ? "Kabul ediliyor…" : "Evet, kabul et"}
        </Button>
      </div>
    </div>
  );
}

export function CloseRequestButton({ requestId }: { requestId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        className="w-full py-2 text-center text-sm font-bold text-suk-danger"
        onClick={() => setConfirming(true)}
      >
        İlanı kapat
      </button>
    );
  }
  return (
    <div className="mk-card space-y-3 p-4">
      <p className="text-sm font-semibold">İlanı kapatmak istediğine emin misin?</p>
      <p className="text-sm text-muted-foreground">
        Hizmet verenler artık göremez ve teklif veremez. Bekleyen teklifler kapanır.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondaryOutline" disabled={pending} onClick={() => setConfirming(false)}>
          Vazgeç
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            const result = await closeServiceRequest(requestId);
            setPending(false);
            if ("error" in result) {
              toast.error(result.error);
              return;
            }
            toast.success("İlan kapatıldı");
            router.refresh();
          }}
        >
          {pending ? "Kapatılıyor…" : "Evet, kapat"}
        </Button>
      </div>
    </div>
  );
}

export function ReviewForm({ quoteId }: { quoteId: number }) {
  const router = useRouter();
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await createReview({ quoteId, stars, body });
        setPending(false);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success("Yorumun kaydedildi");
        router.refresh();
      }}
    >
      <p className="text-sm font-semibold">Bu hizmet vereni puanla</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`h-11 w-11 rounded-xl border-2 border-b-4 text-sm font-bold transition-all active:translate-y-[2px] active:border-b-2 ${
              stars === value ? "border-suk-brand bg-suk-brand text-suk-brand-fg" : "border-border bg-card"
            }`}
            onClick={() => setStars(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Yorumun (isteğe bağlı)"
        className="mk-input min-h-24"
      />
      <Button type="submit" variant="primary" disabled={pending}>
        Yorumu gönder
      </Button>
    </form>
  );
}

export function QuoteForm({ requestId }: { requestId: number }) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await submitQuote({
          requestId,
          priceTl: Number(price.replace(/\./g, "").replace(",", ".")),
          message,
        });
        setPending(false);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        router.push(`/hizmet-veren/teklifler/${result.id}`);
        router.refresh();
      }}
    >
      <label className="block text-sm font-semibold">
        Fiyat
        <input
          inputMode="numeric"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="mk-input mt-1"
          placeholder="TL"
        />
      </label>
      <label className="block text-sm font-semibold">
        Mesaj
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mk-input mt-1 min-h-28"
        />
      </label>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        Teklif ver
      </Button>
    </form>
  );
}
