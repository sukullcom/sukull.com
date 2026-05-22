import { createServerClient, type CookieOptions, type SetAllCookies } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { ensurePublicUserFromAuth } from '@/lib/ensure-public-user';
import { getRequestLogger } from '@/lib/logger';
import { syncAdminRoleFromEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// GoTrue'nun bize döndürdüğü mesaj operasyonel ipucu içerir ama
// tüm metni URL'e asla geçirmeyiz: e-posta, token parçası vb.
// barındırabilir. Teşhis için `reason` query parametresine ilk 120
// karakter, alfasayısal/temel noktalama ile sınırlı biçimde gider.
const sanitizeReason = (msg: unknown): string => {
  if (typeof msg !== 'string') return 'unknown';
  const cleaned = msg.replace(/[^\w\s\-.:,()]+/g, ' ').trim();
  return cleaned.slice(0, 120) || 'unknown';
};

/**
 * Supabase `AuthApiError`'larını "kullanıcı tarafı" vs. "altyapı tarafı"
 * olarak sınıflandırır. Süresi geçmiş / iki kez tıklanmış e-posta linki,
 * yanlış parola, PKCE cookie eksikliği gibi durumlar 400-class HTTP
 * statüsleriyle gelir; bunlar `error_log` tablosunun gerçek müşterisi
 * değil — operasyona yansıyacak bir bug yok, sadece kullanıcı davranışı.
 *
 * Statüsü olmayan (network / unknown) veya 500+ hatalar gerçekten
 * incelenmesi gereken olaylardır; onları `error` seviyesinde tutuyoruz.
 *
 * Bilinen ekstra kullanıcı-tarafı `code` değerleri için isim eşleştirmesi
 * de yapıyoruz; Supabase bazı sürümlerde 200 + `code` ile dönmeyi tercih
 * edebiliyor (örn. eski `otp_expired`).
 */
const USER_SIDE_AUTH_CODES = new Set<string>([
  'otp_expired',
  'otp_disabled',
  'invalid_credentials',
  'email_not_confirmed',
  'email_address_not_authorized',
  'invalid_grant',
  'bad_oauth_state',
  'access_denied',
  'invalid_request',
  'token_already_used',
  'invalid_token',
  'token_not_found',
  'flow_state_expired',
  'flow_state_not_found',
]);

function isUserSideAuthError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: unknown; code?: unknown; name?: unknown };

  if (typeof e.code === 'string' && USER_SIDE_AUTH_CODES.has(e.code)) {
    return true;
  }
  if (typeof e.status === 'number') {
    return e.status >= 400 && e.status < 500;
  }
  // Statüsü yok → ağ kaynaklı olabilir; sistem hatası olarak değerlendir.
  return false;
}

type PendingCookie = { name: string; value: string; options: CookieOptions };

/**
 * `next/headers` `cookies()` read API'si Route Handler içinde istek
 * cookie'leriyle bire bir tutarlı olmayabiliyor; PKCE `code_verifier`
 * bu yüzden boş kalabiliyor. Supabase önerisi: `NextRequest` üstünden
 * oku, `Set-Cookie` yazarken dönen `NextResponse` nesnesine uygula.
 */
function buildSupabaseForRequest(request: NextRequest) {
  const pendingCookies: PendingCookie[] = [];
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: ((toSet) => {
        toSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options: options as CookieOptions });
        });
      }) satisfies SetAllCookies,
    },
  });
  const applyCookies = (res: NextResponse) => {
    for (const { name, value, options } of pendingCookies) {
      res.cookies.set(name, value, options);
    }
  };
  return { supabase, applyCookies };
}

export async function GET(request: NextRequest) {
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

    const { supabase, applyCookies } = buildSupabaseForRequest(request);
    let authUser = null;

    if (tokenHash && type) {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as 'signup' | 'email' | 'recovery' | 'invite',
      });

      if (verifyError) {
        // Süresi geçmiş / iki kez tıklanmış link gibi 400-class hatalar
        // operasyona değer üretmez; warn olarak stdout'a düşer, error_log'a
        // satır yazılmaz. Beklenmedik bir altyapı arızasında (5xx / status
        // yok) error seviyesinde kalmaya devam eder.
        const userSide = isUserSideAuthError(verifyError);
        const verifyMeta = {
          type,
          authErrorStatus:
            (verifyError as { status?: number }).status ?? null,
          authErrorCode:
            (verifyError as { code?: string }).code ?? null,
        };
        if (userSide) {
          log.warn('token verification rejected (user-side)', verifyMeta);
        } else {
          log.error({
            message: 'token verification failed',
            error: verifyError,
            source: 'api-route',
            location: 'auth/callback/verifyOtp',
            fields: verifyMeta,
          });
        }
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
        // kullanımlık code'un yeniden tüketilmesinden gelir.
        const fromRequest = request.cookies.getAll();
        const sbNames = fromRequest
          .map((c) => c.name)
          .filter((n) => n.startsWith('sb-'));
        const hasCodeVerifier = sbNames.some((n) => n.endsWith('-code-verifier'));

        let referrerHost: string | null = null;
        try {
          const ref = request.headers.get('referer');
          if (ref) referrerHost = new URL(ref).host;
        } catch {
          referrerHost = null;
        }

        const exchangeMeta = {
          codeExchangeMessage: authError.message,
          authErrorStatus: (authError as { status?: number }).status ?? null,
          authErrorCode: (authError as { code?: string }).code ?? null,
          callbackHost: requestUrl.host,
          referrerHost,
          sbCookieCount: sbNames.length,
          hasCodeVerifierCookie: hasCodeVerifier,
        };
        // PKCE cookie eksikliği / kullanılmış code 400-class döner;
        // operasyonel bug değil, kullanıcı tıklama desenidir. Beklenmedik
        // upstream arızası (5xx / network) hâlâ error olarak loglanır.
        if (isUserSideAuthError(authError)) {
          log.warn('code exchange rejected (user-side)', exchangeMeta);
        } else {
          log.error({
            message: 'code exchange failed',
            error: authError,
            source: 'api-route',
            location: 'auth/callback/exchangeCode',
            fields: exchangeMeta,
          });
        }

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
          const pendingRef = request.cookies.get("sk_ref")?.value ?? null;
          await ensurePublicUserFromAuth(
            authUser,
            usernameFromMetadata,
            pendingRef,
          );
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
    
    const res = NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
    applyCookies(res);
    res.cookies.set("sk_ref", "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
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
