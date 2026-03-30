import { createClient } from '@/utils/supabase/server';
import { users } from '@/utils/users';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const tokenHash = requestUrl.searchParams.get('token_hash');
    const type = requestUrl.searchParams.get('type') as string | null;
    const error = requestUrl.searchParams.get('error');
    const next = requestUrl.searchParams.get('next');

    if (error) {
      console.error('Auth callback error:', error);
      const errorUrl = new URL('/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', error);
      return NextResponse.redirect(errorUrl);
    }

    const supabase = await createClient();
    let authUser = null;

    if (tokenHash && type) {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as 'signup' | 'email' | 'recovery' | 'invite',
      });

      if (verifyError) {
        console.error('Token verification error:', verifyError.message);
        const errorUrl = new URL('/auth-error', requestUrl.origin);
        errorUrl.searchParams.set('error', verifyError.message);
        return NextResponse.redirect(errorUrl);
      }
      authUser = data.user;
    } else if (code) {
      const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

      if (authError) {
        console.error('Code exchange error:', authError.message);
        const errorUrl = new URL('/auth-error', requestUrl.origin);
        errorUrl.searchParams.set('error', authError.message);
        return NextResponse.redirect(errorUrl);
      }
      authUser = data.user;
    } else {
      const errorUrl = new URL('/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', 'Doğrulama parametresi bulunamadı');
      return NextResponse.redirect(errorUrl);
    }

    const isPasswordRecovery = type === 'recovery' || 
                                next === '/reset-password' ||
                                requestUrl.href.includes('type=recovery');

    let redirectTo = '/courses';
    
    if (isPasswordRecovery) {
      redirectTo = '/reset-password';
    } else {
      if (authUser) {
        try {
          const usernameFromMetadata = authUser.user_metadata?.username;
          await users.captureUserDetails(authUser, usernameFromMetadata);
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
    errorUrl.searchParams.set('error', 'Kimlik doğrulama başarısız');
    return NextResponse.redirect(errorUrl);
  }
}