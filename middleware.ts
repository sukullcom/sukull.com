// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

export async function middleware(req: NextRequest) {
  const { supabase, response } = createClient(req);
  
  const { pathname } = req.nextUrl;
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googleapis.com https://cdn.jsdelivr.net https://www.youtube.com https://s.ytimg.com https://googleads.g.doubleclick.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https: blob: https://*.ytimg.com https://*.ggpht.com https://*.googleusercontent.com; font-src 'self' data: https://cdn.jsdelivr.net; connect-src 'self' https://*.railway.app http://localhost:3001 https://api.supabase.io https://*.supabase.co wss://*.supabase.co https://www.googleapis.com https://emkc.org https://*.youtube.com https://googleads.g.doubleclick.net https://*.lambda-url.eu-central-1.on.aws; media-src 'self' blob: https://*.googlevideo.com; worker-src 'self' blob: https://cdn.jsdelivr.net; frame-src 'self' https://www.youtube.com https://youtube.com;"
  );
  
  const disabledRoutes = ['/lab', '/games/piano'];
  const isDisabledRoute = disabledRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isDisabledRoute) {
    return NextResponse.redirect(new URL('/games', req.url));
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
  
  // Use getUser() for secure JWT validation instead of getSession() which trusts the cookie blindly
  const { data: { user } } = await supabase.auth.getUser();
  
  const publicPaths = [
    '/login',
    '/create-account',
    '/forgot-password',
    '/resend-verification',
    '/callback',
    '/reset-password',
    '/auth-error',
    '/clear-session',
    '/diagnose',
  ];
  
  if (pathname === '/') {
    return response;
  }
  
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(path)) || 
                   pathname.startsWith('/api/auth/');
                   
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    return response;
  }
  
  if (!user && !isPublic) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
  
  if (user && publicPaths.some(path => pathname === path)) {
    if (pathname === '/reset-password') {
      return response;
    }
    
    if (pathname === '/clear-session') {
      return response;
    }
    
    if (pathname === '/login' && req.nextUrl.searchParams.get('logout') === 'true') {
      return response;
    }
    
    return NextResponse.redirect(new URL('/learn', req.url))
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
