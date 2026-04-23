import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Wraps `createServerClient` with Supabase-aware cookie handling.
 *
 * `forwardHeaders` (optional) lets the middleware inject extra headers
 * — most notably `x-request-id` — onto the downstream request that
 * Server Components / API routes will see. Without this, headers set on
 * the response are **not** visible to `next/headers`'s `headers()`
 * inside the rendered route; Next only forwards what's on `request`.
 */
export function createClient(
  request: NextRequest,
  forwardHeaders?: Record<string, string>,
) {
  const forwardedRequestInit = forwardHeaders
    ? {
        headers: (() => {
          const h = new Headers(request.headers)
          for (const [k, v] of Object.entries(forwardHeaders)) h.set(k, v)
          return h
        })(),
      }
    : request

  const response = NextResponse.next({ request: forwardedRequestInit })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { supabase, response }
}
