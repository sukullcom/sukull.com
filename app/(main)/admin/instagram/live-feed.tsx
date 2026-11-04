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

export function InstagramLiveFeed() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/instagram/comments", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { comments: Comment[] };
        if (cancelled) return;
        setComments(data.comments);
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
            Yayın açıkken ikinci hesaptan bir yorum yaz. Yeni satır burada belirir.
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
    </div>
  );
}
