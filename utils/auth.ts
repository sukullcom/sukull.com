import { createClient } from '@/utils/supabase/client'
import { getApiAuthCallbackUrl } from '@/lib/oauth-callback-url'
import { clientLogger } from '@/lib/client-logger'

function browserClient() {
  return createClient()
}

export const auth = {
  async signInWithOAuth(provider: 'google', nextUrl?: string) {
    const redirectTo = getApiAuthCallbackUrl();
    const supabase = browserClient();
    
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
      
      const { error } = await browserClient().auth.signOut({ scope: 'local' });
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      clientLogger.error({
        message: 'logout failed',
        error,
        location: 'utils/auth/signOut',
      });
      throw error;
    }
  },

  async resetPassword(newPassword: string) {
    const { data, error } = await browserClient().auth.updateUser({ password: newPassword })
    if (error) throw error
    return data
  },
}
