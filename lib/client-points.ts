"use client";

import { emitProgressUpdated } from "@/lib/progress-events";

/**
 * Oyun puanlarını `addPointsToUser` server action'ını *doğrudan* çağırmıyoruz;
 * aynı mantık `POST /api/user/points/add` üzerinden ilerir. Aksi hâlde
 * Next.js server-action tamamlanması sonrası tüm RSC ağacını tazeleme
 * davranışı, oyun bitti ekranının kaybolup ana sayfa/listeye sıçrayabilmesine
 * yol açabiliyor. Normal `fetch` bu uygulamalı yönlendirmeyi tetiklemez.
 */
export async function awardGamePoints(points: number, gameType: string) {
  const res = await fetch("/api/user/points/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ points, gameType }),
    credentials: "same-origin",
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    pointsAdded?: number;
    newTotal?: number | null;
  };

  if (!res.ok) {
    const err = new Error(
      typeof data.error === "string" && data.error.length
        ? data.error
        : "Puanlar kaydedilemedi"
    );
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  emitProgressUpdated({ source: `game:${gameType}`, points });
  return {
    success: true as const,
    pointsAdded: data.pointsAdded ?? points,
    newTotal: data.newTotal ?? null,
  };
}
