import { getServerUser } from "./auth";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const adminEmails = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map(email => email.trim().toLowerCase())
  : [];

/**
 * Unified admin check: uses DB role as source of truth,
 * auto-syncs from ADMIN_EMAILS when they diverge.
 */
export const isAdmin = async () => {
  const user = await getServerUser();
  if (!user) return null;

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });

  if (userRecord?.role === "admin") return true;

  const emailMatch = user.email
    ? adminEmails.includes(user.email.toLowerCase())
    : false;

  if (emailMatch && userRecord) {
    // At this point role is guaranteed non-admin (earlier early-return handles admins)
    await db.update(users)
      .set({ role: "admin", updated_at: new Date() })
      .where(eq(users.id, user.id));
    return true;
  }

  return false;
};

/**
 * Synchronizes admin role in the database with the ADMIN_EMAILS list
 * @returns true if the user's role was updated, false otherwise
 */
export const syncAdminRole = async () => {
  const user = await getServerUser();
  if (!user || !user.email) return false;
  
  const isUserAdmin = adminEmails.includes(user.email.toLowerCase());
  
  // Get current user record
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });
  
  // If user's admin status in the database doesn't match their email status
  if (userRecord && (
    (isUserAdmin && userRecord.role !== "admin") || 
    (!isUserAdmin && userRecord.role === "admin")
  )) {
    // Update the role in the database
    await db.update(users)
      .set({ 
        role: isUserAdmin ? "admin" : "user",
        updated_at: new Date()
      })
      .where(eq(users.id, user.id));
    
    return true; // Role was updated
  }
  
  return false; // No update needed
};
