import { createClient } from '@/utils/supabase/server';
import { users } from '@/utils/users';
import { NextResponse } from 'next/server';

// Ensure this route is not prerendered and is treated as dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    
    console.log('OAuth/Email verification callback received:', {
      url: request.url,
      hasCode: !!code,
      error: error || 'none'
    });

    if (error) {
      console.error('OAuth/verification error received:', error);
      const errorUrl = new URL('/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', error);
      return NextResponse.redirect(errorUrl);
    }

    if (!code) {
      console.error('No code provided in callback');
      const errorUrl = new URL('/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', 'No authentication code provided');
      return NextResponse.redirect(errorUrl);
    }

    // Create supabase server client
    const supabase = await createClient();
    
    // Exchange the received code for a session
    console.log('Exchanging code for session...');
    const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error('Auth error during code exchange:', authError);
      const errorUrl = new URL('/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error', authError.message);
      return NextResponse.redirect(errorUrl);
    }

    console.log('Session created successfully for user:', data.user?.id);
    console.log('User email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');

    // Capture user details after successful OAuth or email verification
    if (data.user) {
      try {
        console.log('Capturing user details for:', data.user.email);
        console.log('Auth provider:', data.user.app_metadata?.provider);
        console.log('User metadata:', JSON.stringify(data.user.user_metadata, null, 2));
        
        // Extract username from metadata if available (from email signup)
        const usernameFromMetadata = data.user.user_metadata?.username;
        
        await users.captureUserDetails(data.user, usernameFromMetadata);
        console.log('User details captured successfully');
      } catch (err) {
        console.error('Error capturing user details:', err);
        // Proceed even if capturing details fails.
      }
    }

    // Determine redirect location based on the type of authentication
    let redirectTo = '/courses';
    
    // If this was an email verification (not OAuth), redirect to login with success message
    if (data.user?.email_confirmed_at && data.user.app_metadata?.provider === 'email') {
      redirectTo = '/login?verified=true';
    }
    
    const redirectUrl = new URL(redirectTo, requestUrl.origin);
    console.log('Redirecting to:', redirectUrl.toString());
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Callback error:', error);
    
    // Safely handle the case where requestUrl might not be available
    let origin: string;
    try {
      origin = new URL(request.url).origin;
    } catch {
      // Fallback to a default origin if URL parsing fails
      origin = process.env.NEXT_PUBLIC_APP_URL || 'https://sukull.com';
    }
    
    const errorUrl = new URL('/auth-error', origin);
    errorUrl.searchParams.set('error', 'Failed to sign in');
    return NextResponse.redirect(errorUrl);
  }
} 