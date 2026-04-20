'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { users } from '@/utils/users'
import { getAuthError } from '@/utils/auth-errors'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = formData.get('next') as string || '/courses'

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const { message } = getAuthError(error)
    return { error: message }
  }

  if (data.user) {
    try {
      await users.captureUserDetails(data.user)
    } catch (e) {
      console.error('Error capturing user details:', e)
    }
  }

  revalidatePath('/', 'layout')
  redirect(next)
}
