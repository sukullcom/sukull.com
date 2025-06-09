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
    console.log('Creating new user:', { id: user.id, email: user.email, name: user.name, provider: user.provider });
    const { data, error } = await supabase.from('users').insert([user]).single()
    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }
    console.log('User created successfully');
    return data
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
      console.log('Capturing user details for:', authUser.id);
      console.log('Auth user metadata:', JSON.stringify(authUser.user_metadata, null, 2));
      console.log('Auth app metadata:', JSON.stringify(authUser.app_metadata, null, 2));
      
      // Check if user row exists
      const existing = await this.getUser(authUser.id).catch((err) => {
        console.log('User not found in database:', err.message);
        return null;
      });
      
      if (existing) {
        console.log('User already exists in users table');
        return existing
      }

      // If no user row, create new
      const provider = authUser.app_metadata?.provider || 'email'
      console.log('Auth provider:', provider);
      
      // Extract name based on provider
      let name = overrideUsername;
      let avatar = '';
      
      if (!name) {
        if (provider === 'google') {
          // Google can provide name in different places depending on the scope
          name = authUser.user_metadata?.full_name || 
                 authUser.user_metadata?.name ||
                 authUser.user_metadata?.given_name ||
                 authUser.email?.split('@')[0] ||
                 'User';
          
          // Google can provide avatar in different places
          const rawAvatar = authUser.user_metadata?.avatar_url || 
                           authUser.user_metadata?.picture ||
                           '';
          avatar = normalizeAvatarUrl(rawAvatar);
          
          console.log('Extracted Google name:', name);
          console.log('Extracted Google avatar (raw):', rawAvatar);
          console.log('Normalized Google avatar:', avatar);
        } else {
          name = authUser.user_metadata?.full_name ||
                 authUser.email?.split('@')[0] ||
                 'User';
          avatar = normalizeAvatarUrl(authUser.user_metadata?.avatar_url);
        }
      }
      
      console.log('Creating new user with name:', name);
      console.log('User avatar URL:', avatar);
      
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
