// lib/auth.ts
import { createClient } from '@/utils/supabase/server'

export async function getServerUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user || null
}
