import db from "@/db/drizzle";
import { errorLog } from "@/db/schema";

/**
 * Lightweight, Postgres-backed error logger.
 *
 * Writes to the `error_log` table (migration 0023). Never throws — logging
 * failures are swallowed so they cannot take down the caller. Daily cron
 * prunes rows older than 30 days via `cleanup_error_log()`.
 *
 * Use this from server actions, API routes, middleware and cron jobs.
 * Client-side errors should POST to `/api/errors` which forwards here.
 *
 * ## Coalesce (gürültü kontrolü)
 * Aynı `source|location|message` parmak izi 60 sn içinde tekrar gelirse
 * DB insert atlanır; sadece proses içi sayaç artar. TTL dolduktan sonra
 * gelen ilk satıra `metadata.suppressedCount` eklenir — kaç çağrı
 * görmezden gelindiği görünür. Vercel serverless'ta her container kendi
 * sayaçlarını tutar; cross-instance koalesleme rate_limit tablosuna
 * geçmeye gerek bırakmıyor çünkü tek instance içinde hot loop'lar zaten
 * volume'un büyük çoğunluğunu üretiyor.
 *
 * Üretim ölçeğinde fayda: tek bir bozuk hot-path saniyede 50 hata bassa
 * bile DB'ye dakikada en fazla 1 satır düşer; insert bant genişliği 99%
 * azalır, error_log büyümesi yumuşar, cleanup cron'u ucuz kalır.
 */

export type ErrorSource =
  | "server-action"
  | "api-route"
  | "client"
  | "middleware"
  | "cron"
  | "payment";

export type ErrorLevel = "error" | "warn" | "fatal";

export interface LogErrorOptions {
  source: ErrorSource;
  error: unknown;
  location?: string;
  level?: ErrorLevel;
  userId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
  userAgent?: string | null;
  url?: string | null;
}

function extractMessage(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message || error.name, stack: error.stack };
  }
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error).slice(0, 2000) };
  } catch {
    return { message: "Unknown error (unserializable)" };
  }
}

// ─── Coalesce (in-process) ────────────────────────────────────────────────
const COALESCE_TTL_MS = 60_000;
const COALESCE_MAX_KEYS = 500;

type CoalesceEntry = {
  /** Bu pencerede ilk insertin yapıldığı an. */
  firstAt: number;
  /** Pencere boyunca atlanan tekrar sayısı (ilk insert dâhil değil). */
  suppressedCount: number;
};

/**
 * Insertion-order Map LRU davranışı sergiler: `set(key, …)` aynı anahtarı
 * sonradan eklerse listenin sonuna geçer; map dolduğunda en eski (ilk)
 * anahtar pop edilir. Bu bizim ihtiyacımızı karşılar.
 */
const coalesceMap = new Map<string, CoalesceEntry>();

function fingerprint(opts: LogErrorOptions, message: string): string {
  // Parmak izinde userId / requestId yok: aynı bug 10 farklı kullanıcıda
  // tekrarlanıyorsa hâlâ tek "burst" sayılsın istiyoruz.
  return `${opts.source}|${opts.location ?? ""}|${opts.level ?? "error"}|${message.slice(0, 200)}`;
}

/**
 * Geri dönüş `null` ise insert at; aksi halde insert atla — sadece in-memory
 * sayaç artırıldı (ileride bir sonraki insert'le birlikte raporlanacak).
 */
function tryReserveInsert(opts: LogErrorOptions, message: string): {
  suppressedCount: number;
} | null {
  const key = fingerprint(opts, message);
  const now = Date.now();
  const existing = coalesceMap.get(key);

  if (existing && now - existing.firstAt < COALESCE_TTL_MS) {
    existing.suppressedCount += 1;
    // LRU davranışı için yeniden insert: en sonda kalsın.
    coalesceMap.delete(key);
    coalesceMap.set(key, existing);
    return null;
  }

  const previousSuppressed = existing?.suppressedCount ?? 0;

  // Yeni pencere aç. Eski entry varsa onun sayacını yeni insert payload'ına
  // aktarmak için döndürüyoruz.
  coalesceMap.set(key, { firstAt: now, suppressedCount: 0 });

  if (coalesceMap.size > COALESCE_MAX_KEYS) {
    const firstKey = coalesceMap.keys().next().value;
    if (firstKey !== undefined) coalesceMap.delete(firstKey);
  }

  return { suppressedCount: previousSuppressed };
}

export async function logError(opts: LogErrorOptions): Promise<void> {
  try {
    const { message, stack } = extractMessage(opts.error);
    const reservation = tryReserveInsert(opts, message);
    if (!reservation) {
      // Insert atlanıyor; stdout'a kısa bir not bırak ki dev tarafında da
      // sessiz kalmasın. Üretimde JSON log drainini gereksiz şişirmemek
      // için tek satır.
      console.error(
        `[error-logger] coalesced ${opts.source}|${opts.location ?? "?"}`,
      );
      return;
    }

    const baseMeta = opts.metadata ?? null;
    const meta: Record<string, unknown> | null =
      reservation.suppressedCount > 0
        ? {
            ...(baseMeta ?? {}),
            suppressedCount: reservation.suppressedCount,
            suppressedWindowMs: COALESCE_TTL_MS,
          }
        : baseMeta;

    await db.insert(errorLog).values({
      source: opts.source,
      location: opts.location ?? null,
      level: opts.level ?? "error",
      message: message.slice(0, 4000),
      stack: stack ? stack.slice(0, 8000) : null,
      userId: opts.userId ?? null,
      requestId: opts.requestId ?? null,
      metadata: meta,
      userAgent: opts.userAgent ?? null,
      url: opts.url ?? null,
    });
  } catch (dbError) {
    console.error("[error-logger] failed to persist error:", dbError);
    console.error("[error-logger] original error:", opts.error);
  }
}

/**
 * Fire-and-forget variant: schedules the log write without awaiting.
 * Use this from hot paths (middleware, request handlers) where the caller
 * should not pay the DB round-trip latency.
 */
export function logErrorAsync(opts: LogErrorOptions): void {
  void logError(opts).catch(() => {
    // already handled inside logError
  });
}
