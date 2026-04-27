import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { ensurePublicUserFromAuth } from '@/lib/ensure-public-user';
import { getRequestLogger } from '@/lib/logger';
import { syncAdminRoleFromEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GoTrue'nun bize döndürdüğü mesaj operasyonel ipucu içerir ama
// tüm metni URL'e asla geçirmeyiz: e-posta, token parçası vb.
// barındırabilir. Teşhis için `reason` query parametresine ilk 120
// karakter, alfasayısal/temel noktalama ile sınırlı biçimde gider.
const sanitizeReason = (msg: unknown): string => {
  if (typeof msg !== 'string') return 'unknown';
  const cleaned = msg.replace(/[^\w\s\-.:,()]+/g, ' ').trim();
  return cleaned.slice(0, 120) || 'unknown';
};

export async function GET(request: Request) {
  const log = await getRequestLogger({ labels: { module: 'auth-callback' } });
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const tokenHash = requestUrl.searchParams.get('token_hash');
    const type = requestUrl.searchParams.get('type') as string | null;
    const error = requestUrl.searchParams.get('error');
    const next = requestUrl.searchParams.get('next');

    if (error) {
      // Supabase-upstream error codes (`bad_oauth_state`,
      // `access_denied`, etc.) are stable identifiers — safe to
      // forward verbatim. The free-form message in `error_description`
      // is stripped to keep the referrer chain clean; the code is
      // enough for the auth-error page to render a helpful message.
      log.warn('auth callback received error param', { error });
      const errorUrl = new URL('/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error_code', error);
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
        log.error({
          message: 'token verification failed',
          error: verifyError,
          source: 'api-route',
          location: 'auth/callback/verifyOtp',
          fields: { type },
        });
        // Use a stable error code in the URL instead of the raw
        // `verifyError.message`. Supabase messages can include internal
        // hints (e.g. "Token has expired or is invalid") that end up in
        // browser history / Referer headers. The landing page
        // `/auth-error` maps codes back to user-facing copy.
        const errorUrl = new URL('/auth-error', requestUrl.origin);
        errorUrl.searchParams.set('error_code', 'otp_verify_failed');
        return NextResponse.redirect(errorUrl);
      }
      authUser = data.user;
    } else if (code) {
      const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);

      if (authError) {
        // PKCE hatalarının çoğu `code_verifier` cookie'sinin olmayışı
        // (farklı subdomain / 3rd-party cookie block) ya da tek
        // kullanımlık code'un yeniden tüketilmesinden gelir. Sebebi
        // Vercel logs'ta doğru teşhis etmek için burada mevcut
        // Supabase cookie isimlerini (DEĞERLERİNİ DEĞİL) ve referer
        // host'unu da loglarız.
        let cookieNames: string[] = [];
        let hasCodeVerifier = false;
        try {
          const all = cookies().getAll();
          cookieNames = all
            .map((c) => c.name)
            .filter((n) => n.startsWith('sb-'));
          hasCodeVerifier = cookieNames.some((n) =>
            n.endsWith('-auth-token-code-verifier')
          );
        } catch {
          // cookies() nadiren route dışı çağrılırsa hata verir;
          // log'u bölmemek için sessizce geçelim.
        }

        let referrerHost: string | null = null;
        try {
          const ref = request.headers.get('referer');
          if (ref) referrerHost = new URL(ref).host;
        } catch {
          referrerHost = null;
        }

        log.error({
          message: 'code exchange failed',
          error: authError,
          source: 'api-route',
          location: 'auth/callback/exchangeCode',
          fields: {
            codeExchangeMessage: authError.message,
            authErrorStatus: (authError as { status?: number }).status ?? null,
            authErrorCode: (authError as { code?: string }).code ?? null,
            callbackHost: requestUrl.host,
            referrerHost,
            sbCookieCount: cookieNames.length,
            hasCodeVerifierCookie: hasCodeVerifier,
          },
        });

        const errorUrl = new URL('/auth-error', requestUrl.origin);
        errorUrl.searchParams.set('error_code', 'code_exchange_failed');
        errorUrl.searchParams.set('reason', sanitizeReason(authError.message));
        return NextResponse.redirect(errorUrl);
      }
      authUser = data.user;
    } else {
      const errorUrl = new URL('/auth-error', requestUrl.origin);
      errorUrl.searchParams.set('error_code', 'missing_params');
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
          const usernameFromMetadata = authUser.user_metadata?.username as
            | string
            | undefined;
          await ensurePublicUserFromAuth(authUser, usernameFromMetadata);
        } catch (err) {
          log.error({
            message: 'ensure public user failed',
            error: err,
            source: 'api-route',
            location: 'auth/callback/ensurePublicUser',
            userId: authUser?.id ?? null,
          });
        }

        // Admin role reconciliation. Runs once per successful auth
        // callback so `isAdmin()` remains a pure cached read on every
        // subsequent request. Failure here must not block login — the
        // user is already authenticated; we just log and move on.
        try {
          await syncAdminRoleFromEmail({ id: authUser.id, email: authUser.email });
        } catch (err) {
          log.error({
            message: 'admin role sync failed',
            error: err,
            source: 'api-route',
            location: 'auth/callback/syncAdminRole',
            userId: authUser.id,
          });
        }
      }
      
      if (next && next !== '/reset-password') {
        redirectTo = next;
      }
    }
    
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  } catch (error) {
    log.error({
      message: 'auth callback unexpected error',
      error,
      source: 'api-route',
      location: 'auth/callback',
    });

    let origin: string;
    try {
      origin = new URL(request.url).origin;
    } catch {
      origin = process.env.NEXT_PUBLIC_APP_URL || 'https://sukull.com';
    }

    const errorUrl = new URL('/auth-error', origin);
    errorUrl.searchParams.set('error_code', 'callback_unexpected');
    return NextResponse.redirect(errorUrl);
  }
}