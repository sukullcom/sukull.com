import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * createClient used in server actions or server components
 * Removed caching to prevent session leakage between users
 */
export async function createClient() {
  const cookieStore = cookies()
  
  try {
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // It's okay if called from a server component
            }
          },
        },
      }
    );
    
    return client;
  } catch (error) {
    console.error('Error creating server Supabase client:', error);
    // Return a new client without caching on error
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // It's okay if called from a server component
            }
          },
        },
      }
    );
  }
}
