import { createClient } from '@/utils/supabase/server';
import { users } from '@/utils/users';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/courses';
    const error = requestUrl.searchParams.get('error');
    
    console.log('OAuth callback received:', {
      url: request.url,
      hasCode: !!code,
      next,
      error: error || 'none'
    });

    if (error) {
      console.error('OAuth error received:', error);
      const errorUrl = new URL('/auth-error', request.url);
      errorUrl.searchParams.set('error', error);
      return NextResponse.redirect(errorUrl);
    }

    if (!code) {
      console.error('No code provided in callback');
      const errorUrl = new URL('/auth-error', request.url);
      errorUrl.searchParams.set('error', 'No authentication code provided');
      return NextResponse.redirect(errorUrl);
    }

    const supabase = await createClient();
    
    console.log('Exchanging code for session...');
    const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error('Auth error during code exchange:', authError);
      const errorUrl = new URL('/auth-error', request.url);
      errorUrl.searchParams.set('error', authError.message);
      return NextResponse.redirect(errorUrl);
    }

    console.log('Session created successfully for user:', data.user?.id);

    // Capture user details after successful OAuth
    if (data.user) {
      try {
        console.log('Capturing user details for:', data.user.email);
        console.log('Auth provider:', data.user.app_metadata?.provider);
        console.log('User metadata:', JSON.stringify(data.user.user_metadata, null, 2));
        
        await users.captureUserDetails(data.user);
        console.log('User details captured successfully');
      } catch (err) {
        console.error('Error capturing user details:', err);
        // Proceed even if capturing details fails.
      }
    }

    // Ensure next URL is properly formatted
    const redirectUrl = new URL(next, requestUrl.origin);
    console.log('Redirecting to:', redirectUrl.toString());
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Callback error:', error);
    const errorUrl = new URL('/auth-error', request.url);
    errorUrl.searchParams.set('error', 'Failed to sign in');
    return NextResponse.redirect(errorUrl);
  }
}
