import { eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { users } from "@/db/schema";
import {
  normalizeUserRoles,
  primaryRoleFromRoles,
  type UserRole,
  withRoleAdded,
  withRoleRemoved,
} from "@/lib/user-roles";

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { roles: true, role: true },
  });
  if (!row) return ["user", "student"];
  return normalizeUserRoles(row.roles, row.role);
}

export async function persistUserRoles(
  userId: string,
  roles: UserRole[],
): Promise<UserRole[]> {
  const normalized = normalizeUserRoles(roles);
  const primary = primaryRoleFromRoles(normalized);

  await db
    .update(users)
    .set({
      roles: normalized,
      role: primary,
      updated_at: new Date(),
    })
    .where(eq(users.id, userId));

  return normalized;
}

export async function addUserRole(
  userId: string,
  role: UserRole,
): Promise<UserRole[]> {
  const current = await getUserRoles(userId);
  return persistUserRoles(userId, withRoleAdded(current, role));
}

export async function removeUserRole(
  userId: string,
  role: UserRole,
): Promise<UserRole[]> {
  const current = await getUserRoles(userId);
  return persistUserRoles(userId, withRoleRemoved(current, role));
}
