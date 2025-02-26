import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';

export type AuthErrorType =
  | 'InvalidCredentials'
  | 'EmailNotConfirmed'
  | 'InvalidEmail'
  | 'WeakPassword'
  | 'EmailInUse'
  | 'DatabaseError'
  | 'Default';

export const getAuthError = (
  error: SupabaseAuthError | PostgrestError | any
): { type: AuthErrorType; message: string } => {
  if (error?.code) {
    switch (error.code) {
      case '23505':
      case '23503':
        return {
          type: 'EmailInUse',
          message: 'Bu e-posta adresi zaten kullanılıyor. Giriş yapmak için tekrar deneyiniz.',
        };
    }
  }

  if (error?.error_description) {
    const errorMessage = error.error_description.toLowerCase();
    if (errorMessage.includes('user already registered')) {
      return {
        type: 'EmailInUse',
        message: 'Bu e-posta adresi zaten kullanılıyor. Giriş yapmak için tekrar deneyiniz.',
      };
    }
  }

  const errorMessage = error?.message?.toLowerCase() || '';

  if (errorMessage.includes('invalid login credentials')) {
    return {
      type: 'InvalidCredentials',
      message: 'Geçersiz e-posta veya şifre. Lütfen tekrar deneyiniz.',
    };
  }

  if (errorMessage.includes('email not confirmed')) {
    return {
      type: 'EmailNotConfirmed',
      message: 'Lütfen giriş yapmadan önce e-postanızı doğrulayınız.',
    };
  }

  if (errorMessage.includes('invalid email')) {
    return {
      type: 'InvalidEmail',
      message: 'Lütfen geçerli bir e-posta adresi giriniz.',
    };
  }

  if (errorMessage.includes('password')) {
    return {
      type: 'WeakPassword',
      message: 'Şifreniz en az 6 karakter olmalıdır.',
    };
  }

  if (
    errorMessage.includes('email already registered') ||
    errorMessage.includes('email is already registered')
  ) {
    return {
      type: 'EmailInUse',
      message: 'Bu e-posta adresi zaten kullanılıyor. Giriş yapmak için tekrar deneyiniz.',
    };
  }

  return {
    type: 'Default',
    message: 'Bir hata oluştu. Lütfen tekrar deneyiniz.',
  };
};
