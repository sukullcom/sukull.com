// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'
import { getDisabledRoutePrefixes } from '@/lib/feature-flags'
import {
  deriveSessionCacheKey,
  getCachedSession,
  setCachedSession,
  tryExtractTokenExpiry,
} from '@/utils/supabase/session-cache'

const isProd = process.env.NODE_ENV === 'production';

/**
 * One-shot boot warning for operational env vars whose absence causes
 * silent-but-important feature loss (no crash, no error log — things
 * just quietly stop working).
 *
 * `INTERNAL_API_KEY` is the canonical example: when unset,
 * `maybeLogActivity` short-circuits and analytics (`activity_log`,
 * DAU/WAU/MAU dashboards, school-leaderboard activity weighting) go
 * silent without any visible symptom until someone notices empty
 * charts a week later. Emitting a single WARN at module load is
 * cheap (Vercel shows it in Functions → Logs on first cold start
 * per deploy) and gives us a clear signal to reach for the deploy
 * checklist in `docs/RUNBOOK.md`.
 */
if (isProd && !process.env.INTERNAL_API_KEY) {
  console.warn(
    '[middleware] INTERNAL_API_KEY is not set in production — ' +
      'page-view analytics (activity_log) will be disabled silently. ' +
      'See docs/RUNBOOK.md §2.1.',
  );
}

/**
 * Cross-origin allow-list for `/api/*` responses.
 *
 * The Fetch spec mandates that `Access-Control-Allow-Origin` carry a
 * single origin (or the literal `*`). A comma-joined list — which
 * Next's static `headers()` config would have produced — is silently
 * rejected by every modern browser, so `fetch` from any cross-origin
 * caller (future mobile client, preview deploys on sukull-*.vercel.app,
 * marketing subdomains) would fail with an opaque CORS error.
 *
 * We therefore reflect the incoming request's Origin back iff it's in
 * this list. Same-origin traffic has no Origin header on navigations
 * (which is why the old static value worked for the main site — it
 * was never actually exercised cross-origin), so this change is a
 * strict superset of the previous behaviour.
 *
 * Keep this aligned with `payment-server/server.js → ALLOWED_ORIGINS`.
 */
const API_ALLOWED_ORIGINS = new Set<string>(
  [
    'https://sukull.com',
    'https://www.sukull.com',
    process.env.NEXT_PUBLIC_APP_URL,
    !isProd ? 'http://localhost:3000' : null,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0),
);

function pickAllowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get('origin');
  if (!origin) return null;
  return API_ALLOWED_ORIGINS.has(origin) ? origin : null;
}

function applyApiCors(req: NextRequest, response: NextResponse): void {
  const allowed = pickAllowedOrigin(req);
  // Always advertise `Vary: Origin` so intermediate caches don't serve
  // one caller's CORS headers to another.
  const prevVary = response.headers.get('Vary');
  response.headers.set('Vary', prevVary ? `${prevVary}, Origin` : 'Origin');

  if (allowed) {
    response.headers.set('Access-Control-Allow-Origin', allowed);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );
    // Echo what the preflight asked for (if any), falling back to the
    // common set. This keeps bespoke headers like `x-request-id` /
    // `x-internal-key` working without maintaining two lists.
    const requested = req.headers.get('access-control-request-headers');
    response.headers.set(
      'Access-Control-Allow-Headers',
      requested && requested.length > 0
        ? requested
        : 'Content-Type, Authorization, x-request-id',
    );
    response.headers.set('Access-Control-Max-Age', '600');
  }
}

/**
 * Content Security Policy.
 *
 * `'unsafe-inline'` / `'unsafe-eval'` remain on `script-src` because (a) Next.js
 * injects an inline hydration script, (b) Monaco editor evaluates worker code,
 * and (c) some third-party widgets (YouTube, Google Ads) inject scripts at
 * runtime. Tightening to nonce-based CSP is tracked as a separate follow-up.
 *
 * The directives below are the safe, non-breaking hardenings applied now:
 *   • `base-uri 'self'`        → blocks base-tag injection
 *   • `form-action 'self'`     → forms can only submit same-origin
 *   • `frame-ancestors 'none'` → belt-and-braces with X-Frame-Options
 *   • `object-src 'none'`      → no Flash / Java plugins
 *   • `upgrade-insecure-requests` in production only
 *
 * Dev-only hosts (`http://localhost:3001`, `ws://localhost:*`) are stripped in
 * production so the prod policy does not advertise dev infrastructure.
 */
const cspDirectives: string[] = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googleapis.com https://cdn.jsdelivr.net https://www.youtube.com https://s.ytimg.com https://googleads.g.doubleclick.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: https: blob: https://*.ytimg.com https://*.ggpht.com https://*.googleusercontent.com",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  isProd
    ? "connect-src 'self' https://*.railway.app https://api.supabase.io https://*.supabase.co wss://*.supabase.co https://www.googleapis.com https://emkc.org https://*.youtube.com https://googleads.g.doubleclick.net"
    : "connect-src 'self' http://localhost:* ws://localhost:* https://*.railway.app https://api.supabase.io https://*.supabase.co wss://*.supabase.co https://www.googleapis.com https://emkc.org https://*.youtube.com https://googleads.g.doubleclick.net",
  "media-src 'self' blob: https://*.googlevideo.com",
  "worker-src 'self' blob: https://cdn.jsdelivr.net",
  "frame-src 'self' https://www.youtube.com https://youtube.com",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
];
if (isProd) {
  cspDirectives.push("upgrade-insecure-requests");
}

// Module-level freeze: computed once per runtime, not per request.
// With ~300K req/month this saves ~300K × (array.join + object creation).
const CSP_HEADER_VALUE = cspDirectives.join('; ');
const SECURITY_HEADERS_ENTRIES: ReadonlyArray<readonly [string, string]> = Object.freeze([
  ['X-Frame-Options', 'DENY'],
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['X-XSS-Protection', '1; mode=block'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
  ['Content-Security-Policy', CSP_HEADER_VALUE],
] as const);

const publicPaths = [
  '/login',
  '/create-account',
  '/forgot-password',
  '/resend-verification',
  '/callback',
  '/auth/confirm',
  '/reset-password',
  '/auth-error',
  '/clear-session',
  '/diagnose',
];

// Her zaman engellenecek route'lar (hâlâ geliştirme aşamasında olan veya
// kaldırılmış sayfalar). Flag-kontrollü olanlar aşağıda feature-flags
// üzerinden dinamik eklenir, böylece env var ile tek tıkla aktif olur.
const ALWAYS_DISABLED: readonly string[] = ['/games/piano'];
const disabledRoutes: readonly string[] = [
  ...ALWAYS_DISABLED,
  ...getDisabledRoutePrefixes(),
];

/**
 * Correlation id. Every request entering the app gets one at this edge
 * boundary. It's forwarded to downstream Server Components / API routes
 * via a request header (`x-request-id`) so `lib/logger.ts`'s
 * `getRequestLogger()` can bind it automatically.
 *
 * Clients also receive it as a response header; when filing a bug report
 * the id correlates end-to-end with rows in `error_log`.
 */
const REQUEST_ID_HEADER = 'x-request-id';

function generateRequestId(): string {
  // crypto.randomUUID is available in Edge runtime (Next 12+ middleware).
  try {
    return crypto.randomUUID();
  } catch {
    // Extremely defensive: edge runtimes in unusual environments may lack it.
    return `r-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  }
}

/**
 * Cache policy classification.
 *
 * The previous policy emitted `public, max-age=…, s-maxage=…` on the fall-through
 * branch, which covered authenticated pages like `/profile`, `/lesson/*`,
 * `/games/*`, `/private-lesson*`, `/study-buddy`, `/admin/*`. Shared caches
 * (Vercel edge, Cloudflare, corporate proxies) would happily store the SSR'd
 * HTML — containing the user's name, points, hearts, streak — keyed only by
 * URL, and serve it to the next visitor. Real-world user-visible symptom:
 * "I see someone else's profile". A cross-user data leak.
 *
 * The classification below flips that default: anything requiring a logged-in
 * session is now `private, no-store, must-revalidate` with `Vary: Cookie`.
 * Only genuinely anonymous, user-agnostic pages (landing, course catalog) stay
 * on the shared-cache fast path.
 */
type CachePolicy = 'shared' | 'auth-form' | 'private' | 'api';

function classifyCachePolicy(pathname: string, isAuthenticatedRoute: boolean): CachePolicy {
  if (pathname.startsWith('/api/')) return 'api';

  // Auth forms (login/create-account/reset) contain server-rendered CSRF
  // tokens and flash state; caching is actively harmful even for anonymous
  // visitors, so force revalidation every time.
  if (
    pathname === '/login' ||
    pathname === '/create-account' ||
    pathname === '/forgot-password' ||
    pathname === '/resend-verification' ||
    pathname === '/reset-password' ||
    pathname === '/auth-error' ||
    pathname === '/clear-session' ||
    pathname === '/diagnose' ||
    pathname === '/callback' ||
    pathname.startsWith('/auth/')
  ) {
    return 'auth-form';
  }

  // Truly anonymous, user-agnostic SSR output. `/` renders the marketing
  // landing; `/courses` renders the public catalog list; `/yasal/*` are
  // static legal documents. None embed per-user data — all can be served
  // from shared caches without leaking identity.
  if (
    !isAuthenticatedRoute &&
    (pathname === '/' ||
      pathname === '/courses' ||
      pathname.startsWith('/courses/') ||
      pathname === '/yasal' ||
      pathname.startsWith('/yasal/') ||
      pathname === '/unauthorized' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml')
  ) {
    return 'shared';
  }

  // Everything else that reached this middleware is either authenticated
  // content or user-scoped data we can't safely share across sessions.
  return 'private';
}

function applyHeaders(
  response: NextResponse,
  pathname: string,
  requestId: string,
  isAuthenticatedRoute: boolean,
  req?: NextRequest,
) {
  for (const [k, v] of SECURITY_HEADERS_ENTRIES) {
    response.headers.set(k, v);
  }
  response.headers.set(REQUEST_ID_HEADER, requestId);

  const policy = classifyCachePolicy(pathname, isAuthenticatedRoute);

  switch (policy) {
    case 'api':
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      // API responses that originated from a cross-origin fetch need
      // the per-request CORS echo. When `req` isn't provided (caller
      // never crosses origins — e.g. `/api/auth/*` reached only via
      // same-site redirect), we still emit `Vary: Origin` defensively
      // so intermediaries treat variants correctly.
      if (req) applyApiCors(req, response);
      break;
    case 'auth-form':
      // Never cache auth forms. `private` keeps well-behaved CDNs out; `no-store`
      // handles the rest (Cloudflare Free tier, some corporate proxies).
      response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      break;
    case 'shared':
      // Anonymous content: short edge cache + SWR. `Vary: Cookie` is still set
      // defensively so a logged-in visitor's response (which may include extra
      // headers) does not leak back to anonymous visitors.
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
      response.headers.set('Vary', 'Cookie');
      break;
    case 'private':
      // Default for everything authenticated. Browser can still reuse the page
      // on BFCache, but shared caches (Vercel edge / Cloudflare / corporate
      // proxies) are barred from storing it, eliminating the cross-user leak.
      response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
      response.headers.set('Vary', 'Cookie');
      break;
  }

  // `Surrogate-Control` only applies to shared caches (Fastly, Akamai). Keep
  // it aligned with the public policies; omit for private/api so upstream
  // caches don't store despite the browser-facing `Cache-Control`.
  if (policy === 'shared') {
    response.headers.set('Surrogate-Control', 'max-age=120');
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Reuse an upstream request id when a trusted proxy already supplied one
  // (e.g. Vercel infra, load balancer). Otherwise mint a fresh UUID per
  // request. Correlation here flows to logs, error_log and activity_log.
  const incomingRequestId = req.headers.get(REQUEST_ID_HEADER);
  const requestId = incomingRequestId && incomingRequestId.length <= 64
    ? incomingRequestId
    : generateRequestId();

  // Build once: headers forwarded to downstream route handlers so
  // `next/headers` sees `x-request-id` inside Server Components & APIs.
  const forwardedHeaders = new Headers(req.headers);
  forwardedHeaders.set(REQUEST_ID_HEADER, requestId);

  if (disabledRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    const redirect = NextResponse.redirect(new URL('/games', req.url));
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  const isApiRoute = pathname.startsWith('/api/');
  const isAuthApi = pathname.startsWith('/api/auth/');
  const isPublic =
    pathname === '/' ||
    publicPaths.some((p) => pathname === p || pathname.startsWith(p)) ||
    isAuthApi;

  // CORS preflight: answer OPTIONS on /api/* immediately without
  // running any auth flow. Route handlers historically forgot to
  // export `OPTIONS`, which caused Next.js to respond 405 and the
  // browser to fail the real request. Handling the preflight here
  // gives us a single, audited answer for every API route.
  if (isApiRoute && req.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });
    applyApiCors(req, preflight);
    preflight.headers.set(REQUEST_ID_HEADER, requestId);
    return preflight;
  }

  // API routes (except /api/auth/) don't need auth check — they handle it themselves.
  // Public paths and home also don't need getUser(). Skip the Supabase call entirely.
  if (isApiRoute && !isAuthApi) {
    const response = NextResponse.next({ request: { headers: forwardedHeaders } });
    applyHeaders(response, pathname, requestId, false, req);
    return response;
  }

  if (pathname === '/') {
    const { response } = createClient(req, { [REQUEST_ID_HEADER]: requestId });
    applyHeaders(response, pathname, requestId, false, req);
    return response;
  }

  // Always-public marketing/legal pages. These must be reachable for both
  // anonymous visitors (SEO + KVKK / mesafeli satış compliance) AND for
  // signed-in users (footer links from /learn, /shop, etc.) without ever
  // redirecting. We short-circuit before the auth cookie check so Supabase
  // isn't hit for a static document view.
  if (
    pathname === '/yasal' ||
    pathname.startsWith('/yasal/') ||
    pathname === '/courses' ||
    pathname.startsWith('/courses/')
  ) {
    const response = NextResponse.next({ request: { headers: forwardedHeaders } });
    applyHeaders(response, pathname, requestId, false, req);
    return response;
  }

  // Fast-path: detect whether ANY Supabase auth cookie is present (sb-*-auth-token).
  // When absent we can confidently short-circuit without a network roundtrip to
  // Supabase Auth (~30-80ms per request saved). The real JWT validation still
  // happens in server components via supabase.auth.getUser(), which is cached.
  const allCookies = req.cookies.getAll();
  const authCookies = allCookies.filter(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'),
  );
  const hasAuthCookie = authCookies.length > 0;

  // No cookie at all → definitely not logged in.
  if (!hasAuthCookie) {
    const response = NextResponse.next({ request: { headers: forwardedHeaders } });
    applyHeaders(response, pathname, requestId, false, req);
    if (isPublic) return response;

    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    const redirect = NextResponse.redirect(url);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  // --- Hot-path cache lookup -------------------------------------------------
  // If we've successfully verified this exact auth cookie within the cache TTL
  // (default 60 s), trust the cached user id and skip the `getUser()` network
  // call entirely. On sign-out / refresh the cookie value changes so the key
  // changes, which means this cache is self-invalidating. See
  // `session-cache.ts` for the correctness argument.
  const sessionCacheKey = deriveSessionCacheKey(authCookies);
  const cachedSession = sessionCacheKey ? getCachedSession(sessionCacheKey) : null;

  if (cachedSession) {
    // Cache hit: we still need a working response object, but we can skip the
    // network round-trip. `createClient` is cheap (no I/O); we construct it so
    // cookie refresh writes still flow through if supabase.auth does anything
    // further down (e.g. activity logging). For public routes we don't need
    // the Supabase client at all.
    if (isPublic) {
      const response = NextResponse.next({ request: { headers: forwardedHeaders } });
      applyHeaders(response, pathname, requestId, false, req);
      if (publicPaths.some((p) => pathname === p)) {
        if (pathname === '/reset-password' || pathname === '/clear-session') return response;
        if (pathname === '/login' && req.nextUrl.searchParams.get('logout') === 'true') return response;
        const redirect = NextResponse.redirect(new URL('/learn', req.url));
        redirect.headers.set(REQUEST_ID_HEADER, requestId);
        return redirect;
      }
      return response;
    }

    const response = NextResponse.next({ request: { headers: forwardedHeaders } });
    applyHeaders(response, pathname, requestId, true, req);
    // Activity logging: the endpoint re-derives the userId from the
    // forwarded session cookie, so no need to pass it here.
    maybeLogActivity(req, response, pathname, requestId);
    return response;
  }

  // --- Cold-path verification -----------------------------------------------
  // Cookie present but not in cache → perform the full Supabase verification
  // (single network call) and populate the cache for the next 60 s.
  const { supabase, response } = createClient(req, { [REQUEST_ID_HEADER]: requestId });
  applyHeaders(response, pathname, requestId, !isPublic, req);

  if (isPublic) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && publicPaths.some(p => pathname === p)) {
      if (pathname === '/reset-password' || pathname === '/clear-session') return response;
      if (pathname === '/login' && req.nextUrl.searchParams.get('logout') === 'true') return response;
      const redirect = NextResponse.redirect(new URL('/learn', req.url));
      redirect.headers.set(REQUEST_ID_HEADER, requestId);
      return redirect;
    }
    // Cache the positive verification to accelerate subsequent requests.
    if (user && sessionCacheKey) {
      const tokenExpiresAt = tryExtractTokenExpiry(authCookies[0]?.value ?? '');
      setCachedSession(sessionCacheKey, user.id, { tokenExpiresAt });
    }
    return response;
  }

  // Protected page — must have a valid session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    const redirect = NextResponse.redirect(url);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  // Cache the positive verification for this cookie (auto-invalidates on
  // sign-out since the cookie value changes).
  if (sessionCacheKey) {
    const tokenExpiresAt = tryExtractTokenExpiry(authCookies[0]?.value ?? '');
    setCachedSession(sessionCacheKey, user.id, { tokenExpiresAt });
  }

  // NOTE: We intentionally do NOT inject `x-user-id` on the forwarded
  // request here. The Supabase client in `createClient()` already built
  // a response with cookie mutations; re-issuing `NextResponse.next(...)`
  // to add headers after the fact would drop those cookie writes. Server
  // code that needs the user id should call `getServerUser()` (cached
  // per request) or pass it explicitly to `getRequestLogger({ userId })`.

  maybeLogActivity(req, response, pathname, requestId);
  return response;
}

/**
 * Activity logging (page_view events) feeds a **thin** slice of DAU signal.
 *
 * Cost model: each row is a detached `/api/activity-log` + DB INSERT. We keep
 * only a single allowlisted hub (`/learn`) and at most **one** `page_view`
 * per user per 24h (rolling) via `sk_dau`. Engagement (games, ders, mağaza) is
 * still recorded separately via `logActivity()` in server actions.
 *
 * Called from both the cache-hit and cold-verify branches — extracting to
 * a helper keeps the two paths byte-identical and prevents drift.
 */
function maybeLogActivity(
  req: NextRequest,
  response: NextResponse,
  pathname: string,
  requestId: string,
): void {
  if (!LOGGED_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return;
  if (!process.env.INTERNAL_API_KEY) return;

  const DAU_DEDUPE_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const dauCookie = req.cookies.get('sk_dau')?.value;
  const dauFresh = dauCookie
    ? now - Number(dauCookie) < DAU_DEDUPE_MS
    : false;
  if (dauFresh) return;

  response.cookies.set('sk_dau', String(now), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  const origin = req.nextUrl.origin;
  // Forward the caller's Supabase auth cookie so the endpoint can
  // call `getServerUser()` and derive the userId from the verified
  // session — we intentionally don't pass `userId` in the body
  // anymore. If INTERNAL_API_KEY ever leaks, an attacker still
  // needs a valid session cookie to write, which caps the damage
  // to self-harm (spamming their own activity_log).
  const cookieHeader = req.headers.get('cookie') ?? '';

  // Detached fetch: failures are silently swallowed so we never slow the
  // user-facing response even if the log sink is unavailable.
  fetch(`${origin}/api/activity-log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': process.env.INTERNAL_API_KEY,
      cookie: cookieHeader,
      [REQUEST_ID_HEADER]: requestId,
    },
    body: JSON.stringify({
      eventType: 'page_view',
      page: pathname,
    }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * **Single** app-hub heartbeat for cheap DAU. Other routes rely on
 * `game_end`, `lesson_complete`, `shop_purchase` in `activity_log` instead
 * of per-path `page_view` rows.
 */
const LOGGED_PATH_PREFIXES: readonly string[] = ['/learn'] as const;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
