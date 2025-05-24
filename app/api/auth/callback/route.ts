import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const state = requestUrl.searchParams.get('state');
    
    console.log('Custom OAuth callback received:', {
      url: request.url,
      hasCode: !!code,
      hasState: !!state
    });

    if (!code || !state) {
      console.error('Missing code or state in callback');
      return NextResponse.redirect(new URL('/auth-error?error=missing_params', request.url));
    }

    // Create supabase server client
    const supabase = await createClient();
    
    // Exchange the received code for a session
    console.log('Exchanging code for session in custom handler...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth error during code exchange:', error);
      return NextResponse.redirect(new URL(`/auth-error?error=${encodeURIComponent(error.message)}`, request.url));
    }

    console.log('Session created successfully for user:', data.user?.id);
    
    // Parse the state parameter to get the original redirect URL
    let redirectTo = '/courses';
    try {
      const stateObj = JSON.parse(decodeURIComponent(state));
      if (stateObj.redirectTo) {
        redirectTo = stateObj.redirectTo;
      }
    } catch (e) {
      console.error('Error parsing state parameter:', e);
    }

    // Redirect to the app
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  } catch (error) {
    console.error('Custom callback error:', error);
    return NextResponse.redirect(new URL('/auth-error?error=callback_error', request.url));
  }
} 