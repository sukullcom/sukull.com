import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRequestLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const log = await getRequestLogger({ labels: { route: 'api/auth/logout' } });
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error && error.message !== 'Auth session missing!') {
      log.error({ message: 'server logout failed', error, location: 'api/auth/logout' });
    }
    
    const cookieStore = await cookies();
    const response = NextResponse.json({ success: true });
    
    // Clear any Supabase auth cookies
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
      if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
        response.cookies.set(cookie.name, '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0,
          path: '/',
        });
      }
    });
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  } catch (error) {
    log.error({ message: 'logout exception', error, location: 'api/auth/logout' });
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}