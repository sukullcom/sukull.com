"use client";

import { useEffect, useState } from "react";

type Comment = {
  id: number;
  field: string;
  body: string;
  username: string | null;
  mediaProductType: string | null;
  receivedAt: string;
};

type WebhookEvent = {
  id: number;
  outcome: string;
  commentCount: number;
  note: string | null;
  receivedAt: string;
};

const OUTCOME_LABEL: Record<string, string> = {
  signature_rejected: "İstek geldi, imza uymadı. App secret kontrol edilmeli.",
  secret_missing: "İstek geldi, sunucuda app secret yok.",
  invalid_json: "İstek geldi, gövde okunamadı.",
  no_comment: "İstek geldi ama içinde yorum alanı yoktu.",
  stored: "Yorum kaydedildi.",
  save_failed: "Yorum geldi, kayıt sırasında hata oldu.",
  too_large: "İstek çok büyüktü.",
};

export function InstagramLiveFeed() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/instagram/comments", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { comments: Comment[]; events?: WebhookEvent[] };
        if (cancelled) return;
        setComments(data.comments);
        setEvents(data.events ?? []);
        setError(null);
        setUpdatedAt(new Date());
      } catch {
        if (!cancelled) setError("Yorumlar alınamadı. Sayfayı yenile.");
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {error
          ? error
          : updatedAt
            ? `Son kontrol ${updatedAt.toLocaleTimeString("tr-TR")}. Liste iki saniyede bir yenilenir.`
            : "Yorumlar yükleniyor."}
      </p>

      {comments.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="text-xl font-semibold">Henüz yorum yok</p>
          <p className="mt-2 text-muted-foreground">
            Sunucu bu yorumları hiç almadı. Yayın açıkken, test kullanıcısı olan ikinci hesaptan yaz.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-xl border bg-card px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">@{comment.username ?? "bilinmeyen"}</p>
                <time className="text-xs text-muted-foreground" dateTime={comment.receivedAt}>
                  {new Date(comment.receivedAt).toLocaleTimeString("tr-TR")}
                </time>
              </div>
              <p className="mt-2 text-2xl font-medium leading-snug">{comment.body || "(boş yorum)"}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                {comment.field}
                {comment.mediaProductType ? ` · ${comment.mediaProductType}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-xl border bg-card px-5 py-4">
        <h2 className="text-sm font-semibold">Son webhook istekleri</h2>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Henüz istek yok. Meta bu adrese yorum bildirimi göndermedi.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {events.map((event) => (
              <li key={event.id} className="flex items-baseline justify-between gap-3">
                <span>
                  {OUTCOME_LABEL[event.outcome] ?? event.outcome}
                  {event.note ? ` (${event.note})` : ""}
                </span>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={event.receivedAt}>
                  {new Date(event.receivedAt).toLocaleTimeString("tr-TR")}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
