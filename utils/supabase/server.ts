import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cache for server clients to reduce connection overhead
const clientCache = new Map();

/**
 * createClient used in server actions or server components
 * Implements connection pooling and error handling
 */
export async function createClient() {
  const cookieStore = cookies()
  
  // Create a cache key based on the current cookies
  const cacheKey = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join(';');
    
  // Return cached client if available
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey);
  }
  
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
    
    // Store in cache with a 5-minute TTL
    clientCache.set(cacheKey, client);
    setTimeout(() => {
      clientCache.delete(cacheKey);
    }, 5 * 60 * 1000);
    
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
