// utils/auth.ts
import { createClient } from '@/utils/supabase/client'
import { users } from './users'
import type { AuthError } from '@supabase/supabase-js'

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
      throw new Error('This email is already registered. Try signing in instead.')
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
        emailRedirectTo: `${location.origin}/callback`,
        // Ensure email confirmation is required
        data: {
          username: username, // Store username in metadata
        }
      },
    })
    
    if (error) {
      console.error('Signup error:', error);
      throw error;
    }
    
    if (!data.user) {
      throw new Error('Failed to create user account.');
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

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (data.user) {
      // ensure we have a record in 'users' table
      await users.captureUserDetails(data.user)
    }
    return data
  },

  async signInWithOAuth(provider: 'google', nextUrl?: string) {
    try {
      console.log(`Starting OAuth flow for Google...`);
      
      // Use the correct callback URL - this should match what's configured in Supabase
      const redirectTo = `${location.origin}/api/auth/callback`;
      console.log(`Redirect URL: ${redirectTo}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes: 'email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error(`OAuth error for Google:`, error);
        throw error;
      }
      
      if (!data.url) {
        console.error(`No URL returned from Google OAuth`);
        throw new Error(`Failed to start Google authentication`);
      }
      
      console.log(`Successfully initiated Google OAuth. Redirecting to: ${data.url}`);
      
      // Store the nextUrl in sessionStorage for retrieval after OAuth
      if (nextUrl) {
        sessionStorage.setItem('oauth_redirect_url', nextUrl);
      }
      
      // Redirect to the provider's authentication page
      window.location.href = data.url;
      
      return data;
    } catch (error) {
      console.error(`Error in signInWithOAuth for Google:`, error);
      throw error;
    }
  },

  async signOut() {
    try {
      console.log('Starting secure logout process...');
      
      // 1. Clear any OAuth redirect URLs from storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('oauth_redirect_url');
        // Clear any other auth-related storage
        localStorage.removeItem('auth_redirect_url');
      }
      
      // 2. Sign out from Supabase (this invalidates the session server-side)
      const { error } = await supabase.auth.signOut({
        scope: 'global' // This ensures sign out from all devices/sessions
      });
      
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      console.log('Logout successful - session invalidated');
      
      // 3. Additional cleanup for client-side state
      if (typeof window !== 'undefined') {
        // Clear any cached user data
        window.localStorage.clear();
        window.sessionStorage.clear();
        
        // Force a hard navigation to login to ensure complete cleanup
        // Using location.href instead of router.push for security
        window.location.href = '/login';
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Even if logout fails, we should still redirect for security
      if (typeof window !== 'undefined') {
        window.location.href = '/login?error=logout_failed';
      }
      
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
      return { success: true, message: 'If an account exists, a password reset link will be sent.' }
    }

    // else proceed
    const resetLink = `${location.origin}/reset-password`
    const res = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetLink })
    if (res.error) throw res.error

    return {
      success: true,
      message: 'If an account exists, a password reset link will be sent.',
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
        message: 'If an account exists and needs verification, a verification email will be sent.' 
      }
    }

    // Resend verification email
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${location.origin}/callback`,
      }
    })

    if (resendError) {
      console.error('Resend verification error:', resendError);
      throw resendError;
    }

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox and spam folder.',
    }
  },
}
