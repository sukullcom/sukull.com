"use client";

import { useEffect, useRef } from "react";

import { MarketAvatar } from "@/components/marketplace/market-avatar";
import { MessageForm } from "@/components/marketplace/quote-actions";

type ChatMessage = { id: number; senderId: string; body: string; createdAt: Date | string };

const timeFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

export function ChatThread({
  quoteId,
  viewerId,
  otherName,
  otherAvatar,
  messages,
  closedNote,
}: {
  quoteId: number;
  viewerId: string;
  otherName: string;
  otherAvatar: string | null;
  messages: ChatMessage[];
  /** Doluysa yazışma kapalıdır; mesaj kutusu yerine bu not görünür. */
  closedNote?: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastId = messages[messages.length - 1]?.id;

  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [lastId]);

  return (
    <section className="mk-card flex flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b-2 border-border px-4 py-3">
        <MarketAvatar src={otherAvatar} size={36} />
        <h2 className="truncate text-sm font-extrabold">{otherName}</h2>
      </header>
      <div
        ref={scrollRef}
        className="h-[min(60dvh,28rem)] overflow-y-auto overscroll-contain bg-muted/30 px-3 py-4"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            Henüz mesaj yok. İlk mesajı sen yaz.
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => {
              const mine = message.senderId === viewerId;
              return (
                <li key={message.id} className={`flex items-end gap-2 ${mine ? "justify-end" : ""}`}>
                  {!mine && <MarketAvatar src={otherAvatar} size={28} />}
                  <div
                    className={`max-w-[78%] rounded-2xl border-2 px-3 py-2 text-sm ${
                      mine
                        ? "rounded-br-md border-suk-brand/30 bg-suk-brand-soft"
                        : "rounded-bl-md border-border bg-card"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p className="mt-1 text-right text-[11px] text-muted-foreground">
                      {timeFormat.format(new Date(message.createdAt))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="border-t-2 border-border p-3">
        {closedNote ? (
          <p className="text-center text-sm text-muted-foreground">{closedNote}</p>
        ) : (
          <MessageForm quoteId={quoteId} />
        )}
      </div>
    </section>
  );
}
