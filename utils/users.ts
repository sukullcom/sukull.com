// utils/users.ts
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import { normalizeAvatarUrl } from '@/utils/avatar'

const supabase = createClient()

export const users = {
  async getUser(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async createUser(user: {
    id: string
    email: string
    name: string
    avatar: string
    provider: string
    description?: string
    links?: any[]
  }) {
    try {
      const { data, error } = await supabase.from('users').insert([user]).single()
      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }
      return data
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * captureUserDetails
   * 
   * Called whenever a new Auth user is created (or logs in) to ensure
   * a corresponding "users" row exists. 
   * 
   * `overrideUsername` can override the default name if provided (e.g. signUp flow).
   */
  async captureUserDetails(authUser: User, overrideUsername?: string) {
    try {
      // Check if user already exists
      const { data: existingUser, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (err && err.code !== 'PGRST116') {
        throw err;
      }
      
      if (existingUser) {
        return existingUser;
      }
      
      // Get provider from auth user
      const provider = authUser.app_metadata?.provider || 'email';
      
      // Extract name based on provider
      let name = overrideUsername;
      // Always use default mascot avatar for all new users
      let avatar = '/mascot_purple.svg';
      
      if (!name) {
        if (provider === 'google') {
          // Google can provide name in different places depending on the scope
          const googleName = authUser.user_metadata?.name || authUser.user_metadata?.full_name;
          if (googleName) {
            name = googleName;
          }
          avatar = authUser.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/bottts/svg?seed=${authUser.id}`;
        } else {
          name = authUser.user_metadata?.full_name ||
                 authUser.email?.split('@')[0] ||
                 'User';
          // Always use default mascot, not provider avatar
        }
      }
      
      const email = authUser.email || ''

      const newUser = {
        id: authUser.id,
        email,
        name,
        avatar,
        provider,
        description: '',
        links: [],
      }
      return this.createUser(newUser)
    } catch (error) {
      console.error('Error capturing user details:', error);
      throw error;
    }
  },

  /**
   * updateUser
   * 
   * If you want to update name, avatar, etc. in the "users" table
   */
  async updateUser(id: string, updates: Partial<{ name: string; avatar: string; description: string }>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
}
