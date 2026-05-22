import "server-only";
import { pgPool } from "@/db/drizzle";
import { logger, type Logger } from "@/lib/logger";
import { normalizeRateLimitRow, resolveAllowed } from "@/lib/rate-limit-allowed";

/**
 * Lazy module logger.
 *
 * Niye top-level `const log = logger.child(...)` değil?
 *   `logger.ts` → `error-logger.ts` → `error-log-coalesce.ts` → `rate-limit-db.ts` →
 *   `logger.ts` şeklinde döngüsel import zinciri var. Çağrı yapan ilk modül
 *   (örn. `app/api/activity-log/route.ts`) `logger.ts`'i değerlendirirken, bu
 *   dosya da hoisted import'lar üzerinden tekrar `logger.ts`'e dönüyor; o anda
 *   `logger` bağlaması TDZ'de olduğu için top-level `logger.child(...)`
 *   minified prod build'te "Cannot access 'u' before initialization" atıyor ve
 *   Next "Collecting page data" aşamasını bozuyor.
 *
 *   Lazy çözüm: `logger`'ı yalnızca fonksiyon çalışırken (yani tüm modül
 *   gövdeleri tamamlanmışken) tükettiğimiz için TDZ tetiklenmiyor; döngü
 *   "kâğıt üstünde" kalıyor, runtime'da masum.
 */
let _moduleLog: Logger | null = null;
function getModuleLog(): Logger {
  if (_moduleLog) return _moduleLog;
  _moduleLog = logger.child({ labels: { module: "rate-limit-db" } });
  return _moduleLog;
}

/**
 * `shouldPersistErrorToDb` bizi çağırırken kullanılan anahtar prefix'i.
 * Hata yolu (logger.error → logError → shouldPersistErrorToDb → checkRateLimit)
 * sırasında catch bloğunda `getModuleLog().error(...)` çağrılırsa aynı zincir
 * yeniden tetiklenir ve farklı fingerprint'lerle özyineleme zinciri oluşur.
 * Bu prefix gördüğümüzde DB'ye değil yalnızca stdout'a yazıyoruz.
 */
const ERROR_COALESCE_KEY_PREFIX = "error-log-coalesce:";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  /** Seconds until the window resets (>= 0). */
  retryAfter: number;
  /**
   * Set when the Postgres call failed or returned no row — result is a
   * synthetic fallback. Useful so callers do not mislabel DB outages as
   * “quota exceeded”.
   */
  storeError?: boolean;
};

export type RateLimitOptions = {
  /** Unique key identifying the caller + action (e.g. `login:ip:1.2.3.4`). */
  key: string;
  /** Max attempts allowed in the window. */
  max: number;
  /** Window size in seconds. */
  windowSeconds: number;
  /**
   * What to do when the backing store is unavailable (DB down, pool
   * exhausted, etc). Defaults to `"open"` so that a 60-second Postgres
   * blip does not lock every logged-in user out.
   *
   * Set to `"closed"` on endpoints where the cost of an unbounded
   * request flood outweighs the availability hit — in practice that
   * means money flows (payments, credit spend) and destructive writes
   * (account deletion). On those paths, returning 503 during a DB
   * outage is strictly safer than accepting the write. When denying
   * requests, use `rateLimitClosedDenyPayload` so `storeError` maps to
   * 503, not a misleading 429.
   */
  onStoreError?: "open" | "closed";
};

/**
 * Distributed rate limiter backed by the Postgres `check_rate_limit` function.
 * Atomic under concurrent requests and survives across serverless invocations.
 *
 * On DB errors this returns `{ allowed: true }` by default (fail-open)
 * so a transient DB outage never locks all users out. Callers that
 * guard money flows or destructive actions can opt into fail-closed
 * via `onStoreError: "closed"`. Errors are always logged.
 *
 * Satır ayrıştırması `resolveAllowed` içinde — `Boolean(undefined)` tuzaklarından kaçınılır.
 */
export async function checkRateLimit({
  key,
  max,
  windowSeconds,
  onStoreError = "open",
}: RateLimitOptions): Promise<RateLimitResult> {
  try {
    // PG parametrelerini açıkça tiple; aksi hâlde "check_rate_limit(unknown,unknown,unknown)" hatası.
    const { rows } = await pgPool.query<Record<string, unknown>>(
      `SELECT allowed, remaining, reset_at, current_count
       FROM check_rate_limit($1::text, $2::integer, $3::integer)`,
      [key, max, windowSeconds],
    );
    const rawRow = rows[0];

    if (!rawRow) {
      const fallback =
        onStoreError === "closed"
          ? fallbackDeny(windowSeconds)
          : fallbackAllow(max, windowSeconds);
      return { ...fallback, storeError: true };
    }

    const row = normalizeRateLimitRow(rawRow);
    const resetRaw = row.reset_at;
    const resetAt = new Date(resetRaw as string);
    if (Number.isNaN(resetAt.getTime())) {
      if (key.startsWith(ERROR_COALESCE_KEY_PREFIX)) {
        console.warn(
          "[rate-limit-db] check_rate_limit returned invalid reset_at during error-log coalesce",
          { key, resetRaw },
        );
      } else {
        getModuleLog().warn("check_rate_limit returned invalid reset_at", {
          source: "rate-limit-db",
          location: "checkRateLimit/resetAt",
          key,
          resetRaw,
        });
      }
    }
    const retryAfter = Math.max(0, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
    const allowed = resolveAllowed(row, max);
    const remaining = Number(row.remaining ?? 0);
    return {
      allowed,
      remaining,
      resetAt: Number.isNaN(resetAt.getTime())
        ? new Date(Date.now() + windowSeconds * 1000)
        : resetAt,
      retryAfter,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const missingRateLimitFn =
      errMsg.includes("check_rate_limit") && errMsg.includes("does not exist");

    if (key.startsWith(ERROR_COALESCE_KEY_PREFIX)) {
      // Bu çağrı zaten bir error-log coalesce'inin parçası. `getModuleLog().error`
      // → logErrorAsync → logError → shouldPersistErrorToDb → checkRateLimit
      // şeklinde geri dönerse, başarısız DB altında farklı fingerprint'lerle
      // özyineleme zinciri oluşur. Bu nedenle yalnızca stdout'a yazıyoruz;
      // gerçek hata zaten ana çağrıda DB'ye yazılmaya çalışılırken görülecek.
      console.error(
        `[rate-limit-db] check_rate_limit failed during error-log coalesce (${errMsg})`,
      );
    } else {
      getModuleLog().error({
        message: "check_rate_limit failed",
        error,
        source: "middleware",
        location: "rate-limit-db/checkRateLimit",
        fields: {
          key,
          max,
          windowSeconds,
          onStoreError,
          ...(missingRateLimitFn
            ? {
                hint: "DB'de check_rate_limit yok — npm run db:apply -- supabase/migrations/0019_add_rate_limits.sql",
              }
            : {}),
        },
      });
    }
    const fallback =
      onStoreError === "closed"
        ? fallbackDeny(windowSeconds)
        : fallbackAllow(max, windowSeconds);
    return { ...fallback, storeError: true };
  }
}

function fallbackAllow(max: number, windowSeconds: number): RateLimitResult {
  return {
    allowed: true,
    remaining: max,
    resetAt: new Date(Date.now() + windowSeconds * 1000),
    retryAfter: windowSeconds,
  };
}

/**
 * Used when `onStoreError: "closed"` and Postgres `check_rate_limit` fails
 * or returns no row. `storeError: true` is set — use
 * `rateLimitClosedDenyPayload` (or equivalent) so the client gets 503,
 * not a misleading “quota exceeded” 429.
 */
function fallbackDeny(windowSeconds: number): RateLimitResult {
  return {
    allowed: false,
    remaining: 0,
    resetAt: new Date(Date.now() + windowSeconds * 1000),
    retryAfter: windowSeconds,
  };
}

/** Extract client IP from request headers (Vercel / Cloudflare / generic). */
export function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const fly = request.headers.get("fly-client-ip");
  if (fly) return fly.trim();
  const trueClient = request.headers.get("true-client-ip");
  if (trueClient) return trueClient.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

/**
 * Server Actions / Route Handler içinde `headers()` ile gelen `Headers`
 * için IP — `getClientIp` ile aynı öncelik sırası (CF, Fly, vb.).
 */
export function getClientIpFromHeaders(h: Headers): string {
  return getClientIp(new Request("http://localhost", { headers: h }));
}

/**
 * Convenience: build a 429 JSON response with standard headers.
 * Import NextResponse at the call site to avoid a cross-boundary dep here.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt.getTime() / 1000)),
    "Retry-After": String(result.retryAfter),
  };
}

/** Metinler `onStoreError: "closed"` ile kullanılan uçlarda kotayı DB hatasından ayırmak için. */
export type RateLimitClosedDenyMessages = {
  rateLimited: string;
  storeUnavailable: string;
};

export type RateLimitClosedDenyOptions = {
  storeRetryAfterCapSeconds?: number;
  /** 429 gövdesine `retryAfterSeconds` ekle (ör. mesaj kilidi). */
  includeRetryAfterOn429?: boolean;
};

/**
 * `checkRateLimit` + `onStoreError: "closed"` iken `!rl.allowed` olduğunda:
 * gerçek kota → 429, limitör/DB kesintisi (`storeError`) → 503.
 * Böylece kullanıcıya “çok sık” denip altyapı arızası gizlenmez.
 */
export function rateLimitClosedDenyPayload(
  rl: RateLimitResult,
  messages: RateLimitClosedDenyMessages,
  options?: RateLimitClosedDenyOptions,
): { status: 429 | 503; body: Record<string, unknown>; headers: Record<string, string> } {
  const headers = rateLimitHeaders(rl);
  const cap = options?.storeRetryAfterCapSeconds ?? 120;
  if (rl.storeError) {
    return {
      status: 503,
      body: {
        error: messages.storeUnavailable,
        retryAfterSeconds: Math.min(rl.retryAfter, cap),
      },
      headers,
    };
  }
  const body: Record<string, unknown> = { error: messages.rateLimited };
  if (options?.includeRetryAfterOn429) {
    body.retryAfterSeconds = rl.retryAfter;
  }
  return { status: 429, body, headers };
}

/**
 * Preset buckets for common auth and write-heavy endpoints.
 *
 * Naming convention:
 *   • Verbs for writes (booking, snippet, review)
 *   • Plural nouns for reads (schools, teachers)
 *
 * Budget philosophy:
 *   • Auth buckets are narrow (brute-force protection, not UX)
 *   • User writes are generous enough for power users but cap abuse
 *   • Public reads are generous (cache does most of the work) but not infinite
 */
export const RATE_LIMITS = {
  // --- Auth — IP-scoped ---
  /**
   * IP başına giriş denemesi. Paylaşılan NAT (kampüs Wi-Fi) altında bir öğrenci
   * birden fazla deneme yapabilir; 15 dakikalık tavan brute-force'u sınırlar ama
   * dürüst kullanıcıyı engellemez. Email-bazlı `loginEmail` ile beraber çalışır:
   * saldırgan IP rotasyonu yapsa bile aynı e-postaya kapatılır.
   */
  login: { max: 8, windowSeconds: 15 * 60 },
  /**
   * E-posta başına giriş denemesi (savunma derinliği).
   *
   * Niye ayrı bir sayaç? `login` (IP-scope) tek başına yetersizdir: saldırgan
   * proxy/VPN ile her isteğe farklı IP atayabilir, IP sayacı asla dolmaz.
   * E-posta hedefli brute-force'un (parola sözlüğü saldırısı) tek doğru
   * savunması, **hedefin kendisine** ayrı bir kova açmaktır.
   *
   * 30 dakikada 10 deneme: dürüst kullanıcı (parolayı 2-3 kez yanlış yazma)
   * için bol; sözlük saldırısı (saniyede yüzlerce deneme) için pratik olarak
   * imkânsız hale gelir. Eşiğe ulaşan kullanıcı için mesaj nötr — "yanlış
   * şifre" ile "limite ulaşıldı" ayrımı saldırgana enumeration sinyali vermez.
   */
  loginEmail: { max: 10, windowSeconds: 30 * 60 },
  /**
   * E-posta ile kayıt (server action). Okul / kampüs NAT altında toplu
   * kayıt (reklam sonrası) için saatlik tavan yükseltilmiştir; yine de
   * Supabase Auth rate limit + SMTP kotası ayrıca uygulanır.
   */
  signupIp: { max: 500, windowSeconds: 60 * 60 },
  /** Davet çerezi (httpOnly) — paylaşılan IP altında kötüye kullanım sınırı. */
  referralSetCookieIp: { max: 40, windowSeconds: 60 },
  /**
   * Şu an doğrudan bir route'tan tüketilmiyor: `utils/auth.ts` client-side
   * çalışıyor ve Supabase Auth'un kendi rate-limit'i (GoTrue) tek otorite.
   * E-posta gönderim spam'i veya brute-force için ek uygulama-katmanı kotası
   * gerekirse, bu çağrıları bir server action veya API route'a sarmalayıp
   * burada `checkRateLimit` ile bağlanmalı (e-posta key'i + ip key'i).
   */
  resetPassword: { max: 5, windowSeconds: 60 * 60 },
  /** Aynı not — bkz. `resetPassword`. */
  resendVerification: { max: 30, windowSeconds: 15 * 60 },

  // --- Writes — user-scoped ---
  pointsAdd: { max: 120, windowSeconds: 60 },       // ~2/s per user, generous for active play
  /**
   * Admin ders görseli (`/api/upload/image` — yalnızca isAdmin).
   * Tek oturumda onlarca soru/şık görseli normal; eski 10/saat
   * course-builder'da "Çok fazla yükleme denemesi" üretiyordu.
   */
  imageUpload: { max: 120, windowSeconds: 60 * 60 },
  /** Creating or editing a code snippet. Internal "max 3 total" still applies. */
  snippetWrite: { max: 20, windowSeconds: 60 * 60 },
  /** Teacher application submission. */
  applicationSubmit: { max: 5, windowSeconds: 60 * 60 },
  /** Öğretmen profil GET (sık çağrılabilir; genel read'den biraz daha sıkı). */
  teacherProfileRead: { max: 60, windowSeconds: 60 },
  /** Teacher profile self-service (onaylı eğitmen). */
  teacherProfileWrite: { max: 15, windowSeconds: 60 * 60 },
  /** Öğretmenlikten ayrılma — yıkıcı, seyrek. */
  teacherLeave: { max: 3, windowSeconds: 24 * 60 * 60 },
  /** Student listing creation / edit. */
  listingWrite: { max: 20, windowSeconds: 60 * 60 },
  /** Teacher offering on a student listing. Money-adjacent (usage credit deducted). */
  listingOffer: { max: 60, windowSeconds: 60 * 60 },
  /**
   * Yeni mesaj kilidi (öğrenci başına). Var olan kilit satırı için sayaç
   * artmaz; yalnızca gerçekten yeni açılışlar ve başarısız denemeler
   * (önceki sürümde RL kilit öncesi tüketiliyordu) için 100/saat.
   */
  messageUnlock: { max: 100, windowSeconds: 60 * 60 },
  /**
   * Account deletion (GDPR / KVKK right-to-be-forgotten).
   *
   * Destructive and irreversible — we cap at 3 attempts per 24h so a
   * rogue client-side handler can't keep hammering the endpoint while
   * the first call is still tearing down cascades. A genuine user
   * needs exactly one successful call.
   */
  accountDelete: { max: 3, windowSeconds: 24 * 60 * 60 },

  /**
   * Admin manuel kredi atama / iade işlemleri. Hata payı ve fan-out için
   * dakikada 30 atom. Yıkıcı / para-değerinde işlem olduğu için adminin
   * çoklu sekmede klavye-kaza ihtimalini hafifletir.
   */
  adminCreditsGrant: { max: 30, windowSeconds: 60 },
  /**
   * Admin kullanıcı araması (kredi atamak için). Klavye yazımıyla yüksek
   * frekansta vurabilir ama yalnızca admin kullanır.
   */
  adminCreditsSearch: { max: 120, windowSeconds: 60 },
  /**
   * Admin tarafından okul ekleme (`/api/admin/schools` POST). Eksik okulların
   * tek tek eklenmesi yıkıcı değil ama duplicate / hatalı yazım açısından
   * insanı yavaşlatan bir kova istiyoruz. 30/dakika klavye-kazasını engeller,
   * meşru toplu girişi (~1 okul/2sn) rahatlıkla geçirir.
   */
  adminSchoolWrite: { max: 30, windowSeconds: 60 },
  /**
   * Admin okul araması (duplicate kontrolü için). Form alanında debounce'lu
   * arama tetiklendiği için kullanıcı bazında 120/dakika yüksek görünebilir,
   * ama yalnızca admin kullanır.
   */
  adminSchoolSearch: { max: 120, windowSeconds: 60 },

  // --- Reads — user-scoped ---
  /** Genel kullanıcı sıralaması — paylaşılan IP (kampüs Wi‑Fi) ile okunabilir. */
  leaderboard: { max: 180, windowSeconds: 60 },
  /** Per-teacher detail page. */
  teacherDetails: { max: 60, windowSeconds: 60 },
  /** Generic authenticated read bucket when no specific preset fits. */
  read: { max: 120, windowSeconds: 60 },
  /** GET /api/csrf — double-submit token mint. */
  csrfMint: { max: 40, windowSeconds: 60 },
  /** Teacher review POST — 1 / student / teacher / 24h (double-click guard). */
  teacherReviewDaily: { max: 1, windowSeconds: 24 * 60 * 60 },
  /**
   * Marketplace listing reads (list, detail, offers).
   *
   * These GETs hit uncached joins across `private_lesson_listings`,
   * `private_lesson_offers`, and the teacher profile table. At 10k MAU
   * an unthrottled POSTMan loop can easily drive the slow-query shelf
   * above its p99 budget. 90/min is generous for a legitimate user
   * flipping between filters but caps scrapers.
   */
  listingsRead: { max: 90, windowSeconds: 60 },
  /**
   * Message / chat reads (conversation list, transcript, contact reveal).
   *
   * The `[chatId]` transcript endpoint pulls up to 500 rows per call,
   * and the contact-reveal endpoint returns PII after unlock — both
   * warrant a per-user ceiling even behind membership checks. 120/min
   * supports legitimate realtime polling (every ~2 s) but rejects the
   * "scrape every chat I was ever added to" pattern.
   */
  messagesRead: { max: 120, windowSeconds: 60 },
  /**
   * Özel ders sohbetinde mesaj gönderimi (POST transcript). `writeBurst`'tan
   * ayrı sayılır; bot/spam için kullanıcı başına tavan.
   */
  messageSend: { max: 40, windowSeconds: 60 },

  /**
   * Consolidated `/api/user?action=…` reader.
   *
   * Clients poll this for credits + progress + streak changes after
   * mutations. We keep it generous (3/s sustained) but bounded so a
   * runaway useEffect can't pin a single user's connection slot.
   */
  userApiRead: { max: 180, windowSeconds: 60 },
  /**
   * Lightweight per-user probes that get called on every login or
   * navigation (streak continuity check, "do I have a teacher
   * application?" lookup). They're not expensive individually but a
   * client-side loop could make them the cheapest way to DoS the
   * transaction pooler. 60/min is ~10× the realistic rate.
   */
  lightProbe: { max: 60, windowSeconds: 60 },

  // --- Public reads — IP-scoped ---
  /**
   * Okul şehir / ilçe / tür özetleri. `unstable_cache` ile sunucuda ucuz;
   * onboarding’de her kullanıcı ardışık birkaç çağrı yapar. Ağır sorgu
   * kovasından ayrı tutulur — paylaşılan IP (okul Wi‑Fi) altında 429
   * ile “hesap açılamıyor” hissini engellemek için yüksek tavan.
   */
  schoolsCatalogRead: { max: 5000, windowSeconds: 60 },
  /**
   * Okul listesi, isim araması, okul leaderboard GET. Daha maliyetli;
   * katalog özetlerinden ayrı kova (schools-get) ile sınırlanır.
   */
  schoolsRead: { max: 600, windowSeconds: 60 },
  /**
   * POST ile dört okul tipi leaderboard — döngüde birden fazla SELECT.
   */
  schoolsBulkPost: { max: 180, windowSeconds: 60 },
  /** Random avatar generation — cheap but trivially loopable. */
  avatar: { max: 300, windowSeconds: 60 },

  // --- Generic write endpoints ---
  writeBurst: { max: 30, windowSeconds: 60 },

  // --- Client-side error reports — per IP, keep noise out but allow real crashes ---
  errorReport: { max: 30, windowSeconds: 60 },
} as const;
