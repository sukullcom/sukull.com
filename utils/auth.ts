import { createClient } from '@/utils/supabase/client'
import { users } from './users'

const supabase = createClient()

export const auth = {
  /**
   * signUp
   * 
   * @param username - The chosen username
   * @param email
   * @param password
   */
  async signUp(username: string, email: string, password: string) {
    // 1) Check if 'users' table already has this email
    const { data: existingUser, error: checkErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new Error('Bu e-posta adresi zaten kayıtlı. Bunun yerine giriş yapmayı deneyiniz.')
    }

    if (checkErr && checkErr.code !== 'PGRST116') {
      // PGRST116 => no rows
      throw checkErr
    }

    // 2) Attempt to create a Supabase auth user with email confirmation enabled
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/callback`,
        data: {
          username: username,
        }
      },
    })
    
    if (error) {
      console.error('Signup error:', error);
      throw error;
    }
    
    if (!data.user) {
      throw new Error('Kullanıcı hesabı oluşturulamadı. Lütfen tekrar deneyiniz.');
    }

    // 3) Only capture user details if this is not an email confirmation signup
    // (email confirmation signups will be handled by the callback route)
    if (data.user.email_confirmed_at) {
      // User is immediately confirmed (happens in some configurations)
      try {
        await users.captureUserDetails(data.user, username)
      } catch (profileError) {
        console.error('Could not capture user details:', profileError)
      }
    } else {
      // User needs to confirm email first
      console.log('Email confirmation required for user:', data.user.email);
    }
    
    return data
  },

  async signInWithOAuth(provider: 'google', nextUrl?: string) {
    const redirectTo = `${location.origin}/api/auth/callback`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        scopes: 'email profile',
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    
    if (error) {
      throw error;
    }
    
    if (!data.url) {
      throw new Error('Google kimlik doğrulama başlatılamadı');
    }
    
    if (nextUrl) {
      sessionStorage.setItem('oauth_redirect_url', nextUrl);
    }
    
    window.location.href = data.url;
    
    return data;
  },

  async signOut() {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('oauth_redirect_url');
        localStorage.removeItem('auth_redirect_url');
      }
      
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  },

  async resetPasswordRequest(email: string) {
    const { data: userData, error } = await supabase
      .from('users')
      .select('provider')
      .eq('email', email)
      .single()

    // If user doesn't exist or is not 'email' provider, do a "silent success"
    if (!userData || userData.provider !== 'email') {
      return { success: true, message: 'Hesap mevcutsa şifre sıfırlama bağlantısı gönderilecektir.' }
    }

    const res = await supabase.auth.resetPasswordForEmail(email)
    if (res.error) throw res.error

    return {
      success: true,
      message: 'Hesap mevcutsa şifre sıfırlama bağlantısı gönderilecektir.',
    }
  },

  async resetPassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return data
  },

  async resendVerificationEmail(email: string) {
    // Check if user exists and is an email provider user
    const { data: userData, error } = await supabase
      .from('users')
      .select('provider')
      .eq('email', email)
      .single()

    if (!userData || userData.provider !== 'email') {
      return { 
        success: true, 
        message: 'Hesap mevcutsa doğrulama e-postası gönderilecektir.' 
      }
    }

    // Resend verification email
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      }
    })

    if (resendError) {
      console.error('Resend verification error:', resendError);
      throw resendError;
    }

    return {
      success: true,
      message: 'Doğrulama e-postası gönderildi. Gelen kutunuzu ve spam klasörünüzü kontrol edin.',
    }
  },
}
