import { createBrowserClient } from '@supabase/ssr';
import { AUTH_COOKIE_OPTIONS } from '@/utils/supabase/cookie-options';

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (supabaseClient) return supabaseClient;
  
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
    },
  );
  
  return supabaseClient;
};