// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googleapis.com https://cdn.jsdelivr.net https://www.youtube.com https://s.ytimg.com https://googleads.g.doubleclick.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https: blob: https://*.ytimg.com https://*.ggpht.com https://*.googleusercontent.com; font-src 'self' data: https://cdn.jsdelivr.net; connect-src 'self' https://*.railway.app http://localhost:3001 https://api.supabase.io https://*.supabase.co wss://*.supabase.co https://www.googleapis.com https://emkc.org https://*.youtube.com https://googleads.g.doubleclick.net https://*.lambda-url.eu-central-1.on.aws; media-src 'self' blob: https://*.googlevideo.com; worker-src 'self' blob: https://cdn.jsdelivr.net; frame-src 'self' https://www.youtube.com https://youtube.com;",
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

  // Only call getUser() for page-level navigation that actually needs auth gating
  const { supabase, response } = createClient(req);
  applyHeaders(response, pathname);

  if (isPublic) {
    // Already on a public path; check if logged-in user should be redirected away
    const { data: { user } } = await supabase.auth.getUser();
    if (user && publicPaths.some(p => pathname === p)) {
      if (pathname === '/reset-password' || pathname === '/clear-session') return response;
      if (pathname === '/login' && req.nextUrl.searchParams.get('logout') === 'true') return response;
      return NextResponse.redirect(new URL('/learn', req.url));
    }
    return response;
  }

  // Protected page — must have a session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
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
