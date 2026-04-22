import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';

export type AuthErrorType =
  | 'InvalidCredentials'
  | 'EmailNotConfirmed'
  | 'InvalidEmail'
  | 'WeakPassword'
  | 'SamePassword'
  | 'EmailInUse'
  | 'UserNotFound'
  | 'SessionExpired'
  | 'InvalidToken'
  | 'RateLimit'
  | 'SignupDisabled'
  | 'CaptchaFailed'
  | 'OAuthProvider'
  | 'NetworkError'
  | 'DatabaseError'
  | 'Default';

export type AnyAuthLikeError =
  | SupabaseAuthError
  | PostgrestError
  | (Error & { code?: string; status?: number; error_description?: string })
  | { message?: string; code?: string; status?: number; error_description?: string }
  | string
  | null
  | undefined
  | unknown;

/**
 * Translate Supabase/Postgrest/auth errors into friendly Turkish messages.
 * Never surfaces raw English messages to users.
 */
export const getAuthError = (
  error: unknown
): { type: AuthErrorType; message: string } => {
  // Normalise a message string out of whatever we got
  let rawMessage = '';
  let code: string | number | undefined;
  let errorDescription = '';

  if (typeof error === 'string') {
    rawMessage = error;
  } else if (error && typeof error === 'object') {
    rawMessage = (error as { message?: string }).message ?? '';
    code = (error as { code?: string | number }).code;
    errorDescription = (error as { error_description?: string }).error_description ?? '';
  }

  const msg = (rawMessage || errorDescription).toLowerCase();

  // ─── Supabase-specific error codes (newer SDKs expose these) ─────────────
  if (typeof code === 'string') {
    switch (code) {
      case 'invalid_credentials':
        return { type: 'InvalidCredentials', message: 'Geçersiz e-posta veya şifre. Lütfen bilgilerinizi kontrol edip tekrar deneyiniz.' };
      case 'email_not_confirmed':
        return { type: 'EmailNotConfirmed', message: 'Lütfen giriş yapmadan önce e-postanızı doğrulayınız.' };
      case 'user_already_exists':
      case 'email_exists':
      case 'email_address_already_in_use':
        return { type: 'EmailInUse', message: 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyebilirsiniz.' };
      case 'user_not_found':
        return { type: 'UserNotFound', message: 'Bu e-posta adresine kayıtlı bir hesap bulunamadı.' };
      case 'weak_password':
        return { type: 'WeakPassword', message: 'Şifreniz çok zayıf. Lütfen daha güçlü bir şifre belirleyiniz (en az 8 karakter).' };
      case 'same_password':
        return { type: 'SamePassword', message: 'Yeni şifreniz eski şifrenizden farklı olmalıdır.' };
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
      case 'email_send_rate_limit':
        return { type: 'RateLimit', message: 'Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyiniz.' };
      case 'otp_expired':
      case 'otp_disabled':
        return { type: 'InvalidToken', message: 'Doğrulama kodunun süresi dolmuş veya geçersiz. Lütfen yeni bir kod talep ediniz.' };
      case 'session_not_found':
      case 'session_expired':
        return { type: 'SessionExpired', message: 'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapınız.' };
      case 'captcha_failed':
        return { type: 'CaptchaFailed', message: 'Güvenlik doğrulaması başarısız. Lütfen tekrar deneyiniz.' };
      case 'signup_disabled':
        return { type: 'SignupDisabled', message: 'Kayıt şu anda devre dışı. Lütfen daha sonra tekrar deneyiniz.' };
      case 'invalid_email':
        return { type: 'InvalidEmail', message: 'Lütfen geçerli bir e-posta adresi giriniz.' };
    }
  }

  // ─── Postgres error codes (from PostgrestError) ──────────────────────────
  if (typeof code === 'string') {
    switch (code) {
      case '23505':
      case '23503':
        return { type: 'EmailInUse', message: 'Bu e-posta adresi zaten kullanılıyor. Giriş yapmak için tekrar deneyiniz.' };
    }
  }

  // ─── Message-based fallbacks (older SDKs / OAuth / generic errors) ───────
  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid email or password') ||
    msg.includes('invalid credentials')
  ) {
    return { type: 'InvalidCredentials', message: 'Geçersiz e-posta veya şifre. Lütfen bilgilerinizi kontrol edip tekrar deneyiniz.' };
  }

  if (msg.includes('email not confirmed') || msg.includes('email is not confirmed')) {
    return { type: 'EmailNotConfirmed', message: 'Lütfen giriş yapmadan önce e-postanızı doğrulayınız. Doğrulama e-postası gelmediyse yeniden gönderebilirsiniz.' };
  }

  if (msg.includes('user already registered') || msg.includes('already registered') || msg.includes('already been registered')) {
    return { type: 'EmailInUse', message: 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyebilirsiniz.' };
  }

  if (msg.includes('user not found') || msg.includes('no user found')) {
    return { type: 'UserNotFound', message: 'Bu e-posta adresine kayıtlı bir hesap bulunamadı.' };
  }

  if (msg.includes('new password should be different') || msg.includes('same as the old password')) {
    return { type: 'SamePassword', message: 'Yeni şifreniz eski şifrenizden farklı olmalıdır.' };
  }

  if (
    msg.includes('password should be at least') ||
    msg.includes('password is too short') ||
    msg.includes('weak password')
  ) {
    return { type: 'WeakPassword', message: 'Şifreniz yeterince güçlü değil. Lütfen en az 8 karakter kullanınız.' };
  }

  if (msg.includes('invalid email') || msg.includes('email address is invalid')) {
    return { type: 'InvalidEmail', message: 'Lütfen geçerli bir e-posta adresi giriniz.' };
  }

  if (msg.includes('token has expired') || msg.includes('token is invalid') || msg.includes('invalid token') || msg.includes('jwt expired')) {
    return { type: 'InvalidToken', message: 'Bağlantının süresi dolmuş veya geçersiz. Lütfen işlemi yeniden başlatınız.' };
  }

  if (msg.includes('email link is invalid') || msg.includes('link has expired')) {
    return { type: 'InvalidToken', message: 'Bu bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı talep ediniz.' };
  }

  if (
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('email rate limit exceeded')
  ) {
    return { type: 'RateLimit', message: 'Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyip tekrar deneyiniz.' };
  }

  if (msg.includes('captcha')) {
    return { type: 'CaptchaFailed', message: 'Güvenlik doğrulaması başarısız. Lütfen tekrar deneyiniz.' };
  }

  if (msg.includes('signup is disabled') || msg.includes('signups are disabled') || msg.includes('signup disabled')) {
    return { type: 'SignupDisabled', message: 'Kayıt şu anda devre dışı. Lütfen daha sonra tekrar deneyiniz.' };
  }

  if (msg.includes('provider is not enabled') || msg.includes('oauth')) {
    return { type: 'OAuthProvider', message: 'Seçilen giriş sağlayıcısı şu anda kullanılamıyor. Lütfen başka bir yöntem deneyiniz.' };
  }

  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('networkerror')) {
    return { type: 'NetworkError', message: 'Bağlantı sorunu. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.' };
  }

  if (msg.includes('session') && (msg.includes('expired') || msg.includes('not found') || msg.includes('invalid'))) {
    return { type: 'SessionExpired', message: 'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapınız.' };
  }

  // ─── Generic fallback — never surface raw English ────────────────────────
  return {
    type: 'Default',
    message: 'Bir hata oluştu. Lütfen tekrar deneyiniz.',
  };
};
