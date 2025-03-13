import { createBrowserClient } from '@supabase/ssr';

// Create a singleton instance to avoid multiple connections
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (supabaseClient) return supabaseClient;
  
  try {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    return supabaseClient;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Return a fallback client that will retry on next call
    supabaseClient = null;
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
};