// lib/auth.ts
import { createClient } from '@/utils/supabase/server'
import db from '@/db/drizzle'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function getServerUser() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Check if a user has a specific role
 * @param role The role to check for ("user", "teacher", or "admin")
 * @returns true if the user has the specified role, false otherwise
 */
export async function checkUserRole(role: "user" | "teacher" | "admin") {
  const user = await getServerUser()
  if (!user) return false
  
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  })
  
  return userRecord?.role === role
}

/**
 * Require a specific role for access to a page
 * Redirects to unauthorized page if the user doesn't have the required role
 * @param role The required role ("user", "teacher", or "admin")
 */
export async function requireRole(role: "user" | "teacher" | "admin") {
  const hasRole = await checkUserRole(role)
  
  if (!hasRole) {
    redirect("/unauthorized")
  }
}

/**
 * Require admin role for access to a page
 * Redirects to unauthorized page if the user is not an admin
 */
export async function requireAdmin() {
  await requireRole("admin")
}

/**
 * Require teacher role for access to a page
 * Redirects to unauthorized page if the user is not a teacher
 */
export async function requireTeacher() {
  await requireRole("teacher")
}

/**
 * Marketplace sonrası: özel ders akışına erişim için tek gereksinim
 * oturumun açık olmasıdır. Öğrenci onayı kaldırıldığı için
 * `isApprovedStudent` artık back-compat shim; burada doğrudan
 * `getServerUser` kullanıyoruz. Fonksiyon adı çağıran yerlerin
 * değişmemesi için korunuyor.
 *
 * Dönüş: doğrulanmış Supabase user. Page/layout bunu doğrudan kullanabilir.
 */
export async function requireApprovedStudent() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }
  return user
}
