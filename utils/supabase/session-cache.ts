/**
 * Edge-safe per-isolate session cache for middleware.
 *
 * ## Why this exists
 *
 * Every authenticated request used to call `supabase.auth.getUser()` inside
 * the middleware. That call is a network round-trip to Supabase Auth
 * (~30–80 ms p50, >200 ms p99 during regional hiccups) and happens on the
 * **hot path of every page load**. At 10k MAU that compounds into the
 * single biggest contributor to server-timed TTFB.
 *
 * ## What this does
 *
 * Caches the `{ userId }` result of a successful `getUser()` call, keyed by
 * the exact value of the Supabase auth cookie(s) the browser sent, for a
 * short (default 60 s) TTL.
 *
 * ## Why this is safe
 *
 * The cache key is the **cookie value itself**, not the user id. Therefore:
 *
 *   - Sign-out (Supabase clears the auth cookie) → next request has a
 *     different (empty) cookie → cache miss → auth is revalidated.
 *   - Password change / refresh → Supabase rotates the access token →
 *     cookie value changes → new cache key → revalidated.
 *   - Token expiry — we store the JWT's `exp` claim when available and
 *     refuse to return a cached entry past it, so an expired token is
 *     never served from cache even within the 60 s window.
 *
 * The worst case is a 60 s staleness window for **admin role demotion**
 * — because roles are looked up from the DB on each server component
 * render (not cached here), this only affects the middleware's coarse
 * "is there a user at all" check, which never grants elevated
 * privileges by itself.
 *
 * ## Why it's an LRU, not unbounded
 *
 * Edge isolates share memory across requests while warm. An unbounded
 * Map would grow with unique logged-in users until the isolate is
 * recycled. The LRU caps size to ~5 000 entries (~2–3 MB worst case,
 * well under the Edge 128 MB limit) with O(1) get/set.
 */

type SessionCacheEntry = {
  userId: string;
  /** Wallclock epoch-ms at which this cache entry stops being trusted. */
  validUntil: number;
  /** JWT `exp` claim in epoch-ms (if we could parse it); upper bound on trust. */
  tokenExpiresAt?: number;
};

const DEFAULT_TTL_MS = 60_000;
const MAX_ENTRIES = 5_000;

/**
 * Insertion-ordered Map doubles as an LRU: `delete` + `set` re-inserts at
 * the end, so the *first* entry is always the least-recently-used.
 */
const sessionCache = new Map<string, SessionCacheEntry>();

export function getCachedSession(cacheKey: string): SessionCacheEntry | null {
  const entry = sessionCache.get(cacheKey);
  if (!entry) return null;

  const now = Date.now();
  if (entry.validUntil <= now) {
    sessionCache.delete(cacheKey);
    return null;
  }
  if (entry.tokenExpiresAt !== undefined && entry.tokenExpiresAt <= now) {
    // JWT has expired on its own terms — drop even if TTL window is open.
    sessionCache.delete(cacheKey);
    return null;
  }

  // LRU touch: re-insert so this entry moves to the end.
  sessionCache.delete(cacheKey);
  sessionCache.set(cacheKey, entry);
  return entry;
}

export function setCachedSession(
  cacheKey: string,
  userId: string,
  opts?: { ttlMs?: number; tokenExpiresAt?: number },
): void {
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  const entry: SessionCacheEntry = {
    userId,
    validUntil: Date.now() + ttlMs,
    tokenExpiresAt: opts?.tokenExpiresAt,
  };

  if (sessionCache.size >= MAX_ENTRIES) {
    // Evict the single oldest entry. Map iterator yields in insertion order,
    // so `next()` returns the LRU entry.
    const oldest = sessionCache.keys().next();
    if (!oldest.done) sessionCache.delete(oldest.value);
  }

  sessionCache.set(cacheKey, entry);
}

/**
 * Extract a stable cache key from the Supabase auth cookies present on a
 * request. Supabase stores the session as one or more cookies named
 * `sb-<project-ref>-auth-token` (split into `.0`, `.1`, … when the value
 * exceeds ~4 kB). Using the concatenated cookie value as the key means the
 * key changes automatically on sign-out, sign-in, and token refresh — no
 * explicit invalidation ever needed.
 *
 * Returns `null` if no auth cookie is present, so callers can short-circuit
 * without even consulting the cache.
 */
export function deriveSessionCacheKey(
  cookies: Array<{ name: string; value: string }>,
): string | null {
  const authCookies = cookies
    .filter((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
    // Sort so `.0` precedes `.1`; stable ordering across requests.
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  if (authCookies.length === 0) return null;

  // Join with a separator that cannot appear in base64/cookie bodies.
  return authCookies.map((c) => `${c.name}=${c.value}`).join('|');
}

/**
 * Best-effort extraction of the JWT `exp` claim from a Supabase session
 * cookie payload. Supabase stores the session as either a URL-safe
 * base64 JSON blob or a prefixed variant (`base64-<payload>`). We only
 * need the access token's `exp` to enforce JWT-level invalidation inside
 * the cache; if the cookie encoding changes we fall back to the TTL-only
 * guarantee by returning `undefined`.
 */
export function tryExtractTokenExpiry(cookieValue: string): number | undefined {
  try {
    // Strip "base64-" prefix used by @supabase/ssr.
    let payload = cookieValue.startsWith('base64-')
      ? cookieValue.slice('base64-'.length)
      : cookieValue;

    // Some implementations URL-encode the cookie value.
    payload = decodeURIComponent(payload);

    // Convert URL-safe base64 to standard base64.
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4 !== 0) payload += '=';

    const decoded = atob(payload);
    // Expect a JSON object with `access_token`. Anything else is noise.
    const session = JSON.parse(decoded) as { access_token?: string };
    const accessToken = session.access_token;
    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      return undefined;
    }

    const parts = accessToken.split('.');
    if (parts.length < 2) return undefined;

    let headerPayload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (headerPayload.length % 4 !== 0) headerPayload += '=';
    const claims = JSON.parse(atob(headerPayload)) as { exp?: number };
    if (typeof claims.exp !== 'number') return undefined;

    return claims.exp * 1000;
  } catch {
    return undefined;
  }
}
