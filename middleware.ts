// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

export async function middleware(req: NextRequest) {
  // Create supabase auth middleware client
  const { supabase, response } = createClient(req);
  
  const { pathname } = req.nextUrl;
  
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
  
  // Root path is handled differently to avoid redirect loops
  if (pathname === '/') {
    // Don't redirect on root path - the client-side component will handle redirects
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
  
  return response;
}

export const config = {
  matcher: [
    // Match all except static, images, or favicon
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
