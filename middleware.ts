// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

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
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
];
if (isProd) {
  cspDirectives.push("upgrade-insecure-requests");
}

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': cspDirectives.join('; '),
};

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

const disabledRoutes = ['/lab', '/games/piano'];

function applyHeaders(response: NextResponse, pathname: string) {
  for (const [k, v] of Object.entries(securityHeaders)) {
    response.headers.set(k, v);
  }

  if (pathname.startsWith('/courses')) {
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
  } else if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
  } else if (
    pathname.startsWith('/leaderboard') ||
    pathname.startsWith('/shop') ||
    (pathname.startsWith('/learn') && !pathname.includes('/user/'))
  ) {
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
  } else {
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
  }

  response.headers.set('Surrogate-Control', 'max-age=3600');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (disabledRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.redirect(new URL('/games', req.url));
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
    const response = NextResponse.next({ request: req });
    applyHeaders(response, pathname);
    return response;
  }

  if (pathname === '/') {
    const { response } = createClient(req);
    applyHeaders(response, pathname);
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
    const response = NextResponse.next({ request: req });
    applyHeaders(response, pathname);
    if (isPublic) return response;

    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Cookie present — verify with Supabase (this is the only network call left).
  const { supabase, response } = createClient(req);
  applyHeaders(response, pathname);

  if (isPublic) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && publicPaths.some(p => pathname === p)) {
      if (pathname === '/reset-password' || pathname === '/clear-session') return response;
      if (pathname === '/login' && req.nextUrl.searchParams.get('logout') === 'true') return response;
      return NextResponse.redirect(new URL('/learn', req.url));
    }
    return response;
  }

  // Protected page — must have a valid session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Fire-and-forget activity logging for protected page views.
  // Cookie-based dedupe: skip if the same user visited the same page within the last 5 minutes.
  // This eliminates 60-80% of noise from refreshes/back-forward navigation without losing signal.
  if (!pathname.startsWith('/admin') && process.env.INTERNAL_API_KEY) {
    const DEDUPE_WINDOW_MS = 5 * 60 * 1000;
    const cookieName = 'sk_pv';
    const now = Date.now();

    const lastCookie = req.cookies.get(cookieName)?.value;
    let shouldLog = true;
    if (lastCookie) {
      const [lastPath, lastTsStr] = lastCookie.split('|');
      const lastTs = Number(lastTsStr);
      if (lastPath === pathname && Number.isFinite(lastTs) && now - lastTs < DEDUPE_WINDOW_MS) {
        shouldLog = false;
      }
    }

    if (shouldLog) {
      response.cookies.set(cookieName, `${pathname}|${now}`, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10,
        path: '/',
      });

      const origin = req.nextUrl.origin;
      fetch(`${origin}/api/activity-log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({
          userId: user.id,
          eventType: "page_view",
          page: pathname,
        }),
      }).catch(() => {});
    }
  }

  return response;
}

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
