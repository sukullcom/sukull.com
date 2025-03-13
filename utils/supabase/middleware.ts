// utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// public paths that do NOT require login
const publicPaths = [
  '/',
  '/login',
  '/create-account',
  '/forgot-password',
  '/callback',
  '/reset-password',
  '/auth-error',
]

export function createClient(request: NextRequest) {
  // Create a response object that we'll modify and return
  let response = NextResponse.next({ request })

  // Create a server client (SSR) for reading cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // store them in the NextResponse
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { supabase, response }
}

export async function updateSession(request: NextRequest) {
  const { supabase, response } = createClient(request)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const currentPath = request.nextUrl.pathname
  const nextParam = request.nextUrl.searchParams.get('next')
  const nextPath =
    currentPath === '/login' || currentPath === '/create-account'
      ? nextParam || '/'
      : currentPath

  // check if path is public
  const isPublic = publicPaths.some((path) => currentPath.startsWith(path))
  if (!session && !isPublic) {
    // Not logged in => redirect to /login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', currentPath)
    return NextResponse.redirect(url)
  }

  if (session && (currentPath === '/login' || currentPath === '/create-account')) {
    // Already logged in => redirect to next path
    const url = new URL(nextPath, request.url)
    return NextResponse.redirect(url)
  }

  return response
}
