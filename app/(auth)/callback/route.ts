import { createClient } from '@/utils/supabase/server';
import { users } from '@/utils/users';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/courses';

    if (!code) {
      console.error('No code provided in callback');
      throw new Error('No code provided');
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth error:', error);
      throw error;
    }

    // Capture user details after successful OAuth
    if (data.user) {
      try {
        await users.captureUserDetails(data.user);
      } catch (err) {
        console.error('Error capturing user details:', err);
        // Proceed even if capturing details fails.
      }
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    console.error('Callback error:', error);
    const errorUrl = new URL('/auth-error', request.url);
    errorUrl.searchParams.set('error', 'Failed to sign in');
    return NextResponse.redirect(errorUrl);
  }
}
