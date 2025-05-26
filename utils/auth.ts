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

    // 2) Attempt to create a Supabase auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/callback`,
      },
    })
    if (error) throw error
    if (!data.user) throw new Error('Failed to create user account.')

    // 3) Capture user details in 'users' table
    try {
      await users.captureUserDetails(data.user, username)
    } catch (profileError) {
      console.error('Could not capture user details:', profileError)
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
      
      // Create the redirect URL with proper encoding
      const redirectTo = `${location.origin}/api/auth/callback`;
      console.log(`Redirect URL: ${redirectTo}`);
      
      // Create a state parameter that includes the nextUrl
      const stateParam = JSON.stringify({
        redirectTo: nextUrl || '/courses'
      });
      
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
          redirectTo,
          scopes: 'email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            state: encodeURIComponent(stateParam)
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
      
      // Redirect to the provider's authentication page
      window.location.href = data.url;
      
      return data;
    } catch (error) {
      console.error(`Error in signInWithOAuth for Google:`, error);
      throw error;
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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
}
