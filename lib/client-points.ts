"use client";

import { addPointsToUser } from "@/actions/challenge-progress";
import { emitProgressUpdated } from "@/lib/progress-events";

/**
 * İstemci-tarafı puan ekleme sarmalayıcısı: sunucu eylemi başarıyla dönerse
 * `PROGRESS_UPDATED_EVENT` yayar; böylece sağ üstteki Günlük İlerleme ve
 * Günlük Görev widget'ları anında yenilenir.
 *
 * Dönüş: `addPointsToUser` ile birebir aynı Promise.
 */
export async function awardGamePoints(
  points: number,
  gameType: string,
) {
  const result = await addPointsToUser(points, { gameType });
  emitProgressUpdated({ source: `game:${gameType}`, points });
  return result;
}
