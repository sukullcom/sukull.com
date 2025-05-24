// lib/auth.ts
import { createClient } from '@/utils/supabase/server'
import db from '@/db/drizzle'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function getServerUser() {
  try {
    console.log('Getting server user...');
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting server user:', error);
      return null;
    }
    
    if (!data.user) {
      console.log('No authenticated user found');
      return null;
    }
    
    console.log('Server user found:', data.user.id);
    return data.user;
  } catch (error) {
    console.error('Unexpected error in getServerUser:', error);
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
