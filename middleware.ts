// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'
import { getDisabledRoutePrefixes } from '@/lib/feature-flags'

const isProd = process.env.NODE_ENV === 'production';

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
  // landing; `/courses` renders the public catalog list. Neither embeds
  // per-user data.
  if (
    !isAuthenticatedRoute &&
    (pathname === '/' ||
      pathname === '/courses' ||
      pathname.startsWith('/courses/') ||
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

  // API routes (except /api/auth/) don't need auth check — they handle it themselves.
  // Public paths and home also don't need getUser(). Skip the Supabase call entirely.
  if (isApiRoute && !isAuthApi) {
    const response = NextResponse.next({ request: { headers: forwardedHeaders } });
    applyHeaders(response, pathname, requestId, false);
    return response;
  }

  if (pathname === '/') {
    const { response } = createClient(req, { [REQUEST_ID_HEADER]: requestId });
    applyHeaders(response, pathname, requestId, false);
    return response;
  }

  // Fast-path: detect whether ANY Supabase auth cookie is present (sb-*-auth-token).
  // When absent we can confidently short-circuit without a network roundtrip to
  // Supabase Auth (~30-80ms per request saved). The real JWT validation still
  // happens in server components via supabase.auth.getUser(), which is cached.
  const hasAuthCookie = req.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  // No cookie at all → definitely not logged in.
  if (!hasAuthCookie) {
    const response = NextResponse.next({ request: { headers: forwardedHeaders } });
    applyHeaders(response, pathname, requestId, false);
    if (isPublic) return response;

    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    const redirect = NextResponse.redirect(url);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  // Cookie present — verify with Supabase (this is the only network call left).
  // `isPublic` already tells us whether this is an auth-form / landing route;
  // anything else reaching this branch renders per-user content.
  const { supabase, response } = createClient(req, { [REQUEST_ID_HEADER]: requestId });
  applyHeaders(response, pathname, requestId, !isPublic);

  if (isPublic) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && publicPaths.some(p => pathname === p)) {
      if (pathname === '/reset-password' || pathname === '/clear-session') return response;
      if (pathname === '/login' && req.nextUrl.searchParams.get('logout') === 'true') return response;
      const redirect = NextResponse.redirect(new URL('/learn', req.url));
      redirect.headers.set(REQUEST_ID_HEADER, requestId);
      return redirect;
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

  // NOTE: We intentionally do NOT inject `x-user-id` on the forwarded
  // request here. The Supabase client in `createClient()` already built
  // a response with cookie mutations; re-issuing `NextResponse.next(...)`
  // to add headers after the fact would drop those cookie writes. Server
  // code that needs the user id should call `getServerUser()` (cached
  // per request) or pass it explicitly to `getRequestLogger({ userId })`.

  /**
   * Activity logging (page_view events) feeds admin DAU/WAU/MAU analytics.
   *
   * Cost model @10K MAU: every self-fetch is a second Vercel function
   * invocation + a DB INSERT. We cannot log every page view — we must
   * aggressively dedupe.
   *
   * Two-layer dedupe strategy:
   *   1. **Daily cookie (`sk_dau`)** — once per user per 24h any logged path
   *      counts toward DAU/MAU. Single tiny cookie, no server roundtrip.
   *   2. **Per-path cookie (`sk_pv`)** — prevents double-counting the same
   *      path within 4 hours (was: 5 minutes). Covers the majority of
   *      refresh/back-forward noise.
   *
   * Only a small **allowlist** of pages is logged; admin, settings, debug
   * and similar maintenance paths don't feed the analytics signal.
   *
   * Combined effect: ~90% reduction in self-fetches vs. the previous design.
   */
  if (LOGGED_PATH_PREFIXES.some((p) => pathname.startsWith(p)) && process.env.INTERNAL_API_KEY) {
    const PATH_DEDUPE_MS = 4 * 60 * 60 * 1000; // 4 hours
    const DAU_DEDUPE_MS = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();

    const pathCookie = req.cookies.get('sk_pv')?.value;
    const dauCookie = req.cookies.get('sk_dau')?.value;

    let pathFresh = false;
    if (pathCookie) {
      const [lastPath, lastTsStr] = pathCookie.split('|');
      const lastTs = Number(lastTsStr);
      pathFresh = lastPath === pathname && Number.isFinite(lastTs) && now - lastTs < PATH_DEDUPE_MS;
    }

    const dauFresh = dauCookie ? now - Number(dauCookie) < DAU_DEDUPE_MS : false;

    if (!pathFresh || !dauFresh) {
      // Path cookie: used across refreshes
      if (!pathFresh) {
        response.cookies.set('sk_pv', `${pathname}|${now}`, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 4, // 4h
          path: '/',
        });
      }
      // DAU cookie: used to rate-limit overall log volume to 1×/day/user
      if (!dauFresh) {
        response.cookies.set('sk_dau', String(now), {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24, // 24h
          path: '/',
        });
      }

      const origin = req.nextUrl.origin;
      // Detached fetch: failures are silently swallowed so we never slow the
      // user-facing response even if the log sink is unavailable.
      fetch(`${origin}/api/activity-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': process.env.INTERNAL_API_KEY,
          [REQUEST_ID_HEADER]: requestId,
        },
        body: JSON.stringify({
          userId: user.id,
          eventType: 'page_view',
          page: pathname,
        }),
        keepalive: true,
      }).catch(() => {});
    }
  }

  return response;
}

/**
 * Only these high-signal paths are logged for DAU/WAU/MAU analytics.
 * Admin, auth, settings, API callbacks and the like are intentionally
 * excluded: they're either maintenance traffic or already logged
 * elsewhere (e.g. game_end, lesson_complete events).
 */
const LOGGED_PATH_PREFIXES: readonly string[] = [
  '/learn',
  '/games',
  '/lesson',
  '/private-lesson',
  '/leaderboard',
  '/courses',
  '/study-buddy',
  '/profile',
] as const;

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
