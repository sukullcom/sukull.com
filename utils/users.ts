// utils/users.ts
import { createClient } from '@/utils/supabase/client'
import { clientLogger } from '@/lib/client-logger'

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
        clientLogger.error({
          message: 'user insert failed',
          error,
          location: 'utils/users/createUser',
          fields: { userId: user.id },
        });
        throw error;
      }
      return data
    } catch (error) {
      clientLogger.error({
        message: 'user insert threw',
        error,
        location: 'utils/users/createUser',
        fields: { userId: user.id },
      });
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
