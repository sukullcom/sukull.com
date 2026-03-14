import { createClient } from '@/utils/supabase/server';
import { users } from '@/utils/users';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');

    if (error) {
      console.error('Auth callback error:', error);
      const errorUrl = new URL('/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', error);
      return NextResponse.redirect(errorUrl);
    }

    if (!code) {
      const errorUrl = new URL('/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', 'No authentication code provided');
      return NextResponse.redirect(errorUrl);
    }

    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error('Code exchange error:', authError.message);
      const errorUrl = new URL('/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', authError.message);
      return NextResponse.redirect(errorUrl);
    }

    const next = requestUrl.searchParams.get('next');
    const type = requestUrl.searchParams.get('type');
    
    const isPasswordRecovery = type === 'recovery' || 
                                next === '/reset-password' ||
                                requestUrl.href.includes('type=recovery');

    let redirectTo = '/courses';
    
    if (isPasswordRecovery) {
      redirectTo = '/reset-password';
    } else {
      if (data.user) {
        try {
          const usernameFromMetadata = data.user.user_metadata?.username;
          await users.captureUserDetails(data.user, usernameFromMetadata);
        } catch (err) {
          console.error('Error capturing user details:', err);
        }
      }
      
      if (next && next !== '/reset-password') {
        redirectTo = next;
      }
    }
    
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  } catch (error) {
    console.error('Auth callback unexpected error:', error);
    
    let origin: string;
    try {
      origin = new URL(request.url).origin;
    } catch {
      origin = process.env.NEXT_PUBLIC_APP_URL || 'https://sukull.com';
    }
    
    const errorUrl = new URL('/auth-error', origin);
    errorUrl.searchParams.set('error', 'Failed to sign in');
    return NextResponse.redirect(errorUrl);
  }
}