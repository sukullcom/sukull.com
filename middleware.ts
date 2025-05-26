// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

export async function middleware(req: NextRequest) {
  // Create supabase auth middleware client
  const { supabase, response } = createClient(req);
  
  const { pathname } = req.nextUrl;
  
  // Add comprehensive security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add CSP header for additional security
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://api.supabase.io https://*.supabase.co wss://*.supabase.co https://www.googleapis.com; media-src 'self' blob:;"
  );
  
  // Add cache control headers based on route
  if (pathname.startsWith('/courses') || 
      pathname.startsWith('/_next/') || 
      pathname.endsWith('.svg') || 
      pathname.endsWith('.png') || 
      pathname.endsWith('.jpg') || 
      pathname.endsWith('.jpeg')) {
    // Cache static assets aggressively
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
  } else if (pathname.startsWith('/api/')) {
    // Don't cache API routes
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  } else if (
    pathname.startsWith('/leaderboard') || 
    pathname.startsWith('/shop') || 
    pathname.startsWith('/lab') ||
    (pathname.startsWith('/learn') && !pathname.includes('/user/'))
  ) {
    // Cache dynamic but less frequently updated pages
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
  } else {
    // Default for other routes - moderate caching
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
  }
  
  // Add a Surrogate-Control header for CDNs
  response.headers.set('Surrogate-Control', 'max-age=3600');
  
  // Check auth state
  const { data: { session } } = await supabase.auth.getSession();
  
  // Auth redirect logic
  const publicPaths = ['/login', '/create-account', '/forgot-password', '/callback', '/reset-password', '/auth-error'];
  
  // Protected paths that require specific roles
  const adminPaths = ['/admin'];
  const teacherPaths = ['/private-lesson/teacher-dashboard'];
  
  // Root path is handled differently to avoid redirect loops
  if (pathname === '/') {
    // For root path, if user is not authenticated, allow access to marketing page
    // If authenticated, they will be redirected client-side to avoid redirect loops
    return response;
  }
  
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(path)) || 
                   pathname.startsWith('/_next') || 
                   pathname.endsWith('.svg') || 
                   pathname.endsWith('.png') || 
                   pathname.endsWith('.jpg') || 
                   pathname.endsWith('.jpeg');
                   
  if (!session && !isPublic) {
    // Not logged in => redirect to login
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
  
  if (session && publicPaths.some(path => pathname === path)) {
    // Already logged in => redirect to /learn instead of homepage to avoid redirect loop
    return NextResponse.redirect(new URL('/learn', req.url))
  }
  
  // Additional role-based protection (basic check - detailed checks in layouts)
  if (session && adminPaths.some(path => pathname.startsWith(path))) {
    // Admin paths require additional verification in their layouts
    // This is just a basic middleware check
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all except static, images, or favicon
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
