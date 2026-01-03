import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Ensure this route is not prerendered and is treated as dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('Server-side logout initiated');
    
    // Create supabase server client
    const supabase = await createClient();
    
    // Get current user to log the user info (using getUser for security)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('Logging out user:', user.id);
    }
    
    // Sign out from Supabase (server-side session invalidation)
    // Ignore errors if session is already missing
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.log('Server logout info:', error.message);
      // Don't fail if session is already missing - this is actually good!
      if (error.message !== 'Auth session missing!') {
        console.error('Unexpected server logout error:', error);
      }
    }
    
    // Clear all auth-related cookies manually for extra security
    const cookieStore = cookies();
    const response = NextResponse.json({ success: true });
    
    // Clear Supabase auth cookies
    const authCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase.auth.token',
    ];
    
    authCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
    });
    
    // Also clear any cookies that might exist with the project reference
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
    
    console.log('Server-side logout completed successfully');
    
    // Add security headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  } catch (error) {
    console.error('Unexpected error during server logout:', error);
    return NextResponse.json(
      { error: 'Unexpected logout error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 