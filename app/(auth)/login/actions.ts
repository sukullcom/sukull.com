'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { users } from '@/utils/users'
import { getAuthError } from '@/utils/auth-errors'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit-db'

function getIpFromHeaders(h: Headers): string {
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = formData.get('next') as string || '/courses'

  const h = await headers()
  const ip = getIpFromHeaders(h)
  const emailKey = (email || '').toLowerCase().trim()
  const rl = await checkRateLimit({
    key: `login:ip:${ip}:${emailKey}`,
    ...RATE_LIMITS.login,
  })
  if (!rl.allowed) {
    return {
      error: `Çok fazla giriş denemesi. Lütfen ${Math.ceil(rl.retryAfter / 60)} dakika sonra tekrar deneyin.`,
    }
  }

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
