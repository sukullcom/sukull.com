// utils/users.ts
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

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
    const { data, error } = await supabase.from('users').insert([user]).single()
    if (error) throw error
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
    // Check if user row exists
    const existing = await this.getUser(authUser.id).catch(() => null)
    if (existing) {
      return existing
    }

    // If no user row, create new
    const provider = authUser.app_metadata?.provider || 'email'
    const name =
      overrideUsername ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0] ||
      'User'

    const avatar = authUser.user_metadata?.avatar_url || ''
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
