"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";
import { csrfHeader, mintCsrfToken } from "@/lib/mint-csrf-client";

type Message = {
  id: number;
  sender: string;
  content: string;
  createdAt: string;
};

const MAX_LENGTH = 1000;
const POLL_INTERVAL_MS = 8000;

/**
 * Message thread body + compose bar.
 *
 * Pragmatic design choices:
 *   - No realtime socket; we poll `/messages/[chatId]` every 8s to
 *     pick up replies. The thread is long-lived but low-traffic so
 *     the cost is negligible and we avoid a new WS surface.
 *   - Optimistic insert on send, then reconcile with the server row
 *     on success. On failure, the optimistic row is rolled back.
 */
export function ChatThread({
  chatId,
  currentUserId,
  initialMessages,
}: {
  chatId: number;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/private-lesson/messages/${chatId}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data: { messages: Message[] } = await res.json();
        if (cancelled) return;
        setMessages((prev) => {
          if (data.messages.length <= prev.length) return prev;
          return data.messages;
        });
      } catch (error) {
        clientLogger.error({
          message: "poll messages failed",
          error,
          location: "ChatThread/poll",
        });
      }
    };
    const t = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [chatId]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    if (trimmed.length > MAX_LENGTH) {
      toast.error(`Mesaj en fazla ${MAX_LENGTH} karakter olabilir`);
      return;
    }

    const tempId = -Date.now();
    const optimistic: Message = {
      id: tempId,
      sender: currentUserId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setContent("");
    setSending(true);

    try {
      const token = await mintCsrfToken();
      if (!token) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error("Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar dene.");
        setSending(false);
        return;
      }

      const res = await fetch(`/api/private-lesson/messages/${chatId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeader(token),
        },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(data.error || "Mesaj gönderilemedi");
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m)),
      );
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      clientLogger.error({
        message: "send message failed",
        error,
        location: "ChatThread/handleSend",
      });
      toast.error("Bir hata oluştu");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/50 p-3 sm:p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Henüz mesaj yok. İlk mesajı sen gönder!
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-3 py-2 ${
                    mine
                      ? "rounded-2xl rounded-br-md bg-suk-brand text-suk-brand-fg"
                      : "rounded-2xl rounded-bl-md border border-border bg-card"
                  }`}
                >
                  <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                    {m.content}
                  </p>
                  <span
                    className={`text-[10px] block mt-0.5 ${
                      mine ? "text-suk-brand-fg/80" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex shrink-0 items-end gap-2 border-t bg-card p-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder="Mesajını yaz..."
          className="flex-1 resize-none rounded-2xl border border-input px-4 py-2.5 text-sm focus:border-suk-brand focus:outline-none focus:ring-1 focus:ring-suk-brand/25"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-suk-brand text-suk-brand-fg transition-colors hover:bg-suk-brand-hover disabled:bg-muted disabled:text-muted-foreground"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
