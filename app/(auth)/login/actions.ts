'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getAuthError } from '@/utils/auth-errors'
import { checkRateLimit, getClientIpFromHeaders, RATE_LIMITS } from '@/lib/rate-limit-db'
import { logger } from '@/lib/logger'
import { ensurePublicUserFromAuth } from '@/lib/ensure-public-user'

const log = logger.child({ labels: { module: 'auth/login' } })

/**
 * Login akışı — savunma derinliği (defense in depth):
 *
 *   1. **Per-IP rate limit** (`RATE_LIMITS.login`): paylaşılan NAT altında
 *      kötüye kullanımı sınırlar; meşru kullanıcı 8 deneme/15dk ile rahat.
 *   2. **Per-email rate limit** (`RATE_LIMITS.loginEmail`): IP rotasyonu
 *      yapan saldırgana karşı hedef hesabı koruyan ek katman; aynı e-posta
 *      30dk içinde 10'dan fazla denenirse kilitlenir.
 *   3. **Nötr hata metni**: hem "yanlış parola" hem "limit aşıldı" mesajı,
 *      enumeration sinyali vermeyecek şekilde "geçersiz e-posta veya şifre"
 *      altında birleşir. Yalnızca limit metni "x dakika sonra dene" der.
 *   4. **fail-open**: `checkRateLimit` varsayılan davranış olarak DB hatası
 *      anında izin verir — Supabase Auth'un kendi 30/saat limiti bekçi.
 *      Tüm Postgres çöktüğünde sitenin diğer kısmı zaten kırık; brute-force
 *      penceresi pratik olarak operasyonel.
 */
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = formData.get('next') as string || '/courses'

  const h = await headers()
  const ip = getClientIpFromHeaders(h)
  const emailKey = (email || '').toLowerCase().trim()

  // Katman 1: IP-scoped (paylaşılan NAT altında)
  const ipRl = await checkRateLimit({
    key: `login:ip:${ip}`,
    ...RATE_LIMITS.login,
  })
  if (!ipRl.allowed) {
    return {
      error: `Çok fazla giriş denemesi. Lütfen ${Math.ceil(ipRl.retryAfter / 60)} dakika sonra tekrar deneyin.`,
    }
  }

  // Katman 2: Email-scoped (IP rotasyonu yapan saldırgana karşı).
  // Email boş veya geçersiz şekildeyse atla — Supabase Auth zaten formatı
  // reddeder, sayacı kirletme.
  if (emailKey.length > 0 && emailKey.length < 320) {
    const emailRl = await checkRateLimit({
      key: `login:email:${emailKey}`,
      ...RATE_LIMITS.loginEmail,
    })
    if (!emailRl.allowed) {
      // Nötr metin: saldırgan "bu e-posta korunuyor" sinyalini almasın.
      // Meşru kullanıcı zaten kendi e-postasını biliyor.
      log.warn('login email rate-limit hit', {
        location: 'auth/login',
        ip,
        // E-postanın ham halini loglamak KVKK için risk; hash kısaltma yeterli.
        emailHashPrefix: emailKey.slice(0, 3) + '***',
      })
      return {
        error: `Çok fazla giriş denemesi. Lütfen ${Math.ceil(emailRl.retryAfter / 60)} dakika sonra tekrar deneyin.`,
      }
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
      await ensurePublicUserFromAuth(data.user)
    } catch (e) {
      log.error({
        message: 'ensurePublicUserFromAuth failed on login',
        error: e,
        location: 'auth/login/ensurePublicUserFromAuth',
        userId: data.user.id,
      })
    }
  }

  revalidatePath('/', 'layout')
  redirect(next)
}
