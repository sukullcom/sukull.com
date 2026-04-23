// lib/auth.ts
import { createClient } from '@/utils/supabase/server'
import db from '@/db/drizzle'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { isApprovedStudent } from '@/db/queries'

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
 * Özel ders sistemi için "onaylı öğrenci" guard'ı. Akış:
 *   1. Oturum yoksa → /login
 *   2. Onaylı öğrenci değilse → /private-lesson/get (başvuru sayfası)
 *
 * Kullanıcının rolü "student" ise ya da `private_lesson_applications`
 * tablosunda approved=true bir başvurusu varsa onaylı sayılır
 * (bkz. db/queries.ts → isApprovedStudent).
 *
 * Dönüş: doğrulanmış Supabase user. Page/layout bunu doğrudan kullanabilir.
 */
export async function requireApprovedStudent() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  const approved = await isApprovedStudent(user.id)
  if (!approved) {
    redirect("/private-lesson/get")
  }

  return user
}
