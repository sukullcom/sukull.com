/**
 * Çoklu rol modeli — bir hesap aynı anda user, student, teacher ve admin olabilir.
 * `users.roles` kaynak; `users.role` geriye dönük uyumluluk için birincil rol özeti.
 */

export const USER_ROLE_VALUES = ["user", "student", "teacher", "admin"] as const;
export type UserRole = (typeof USER_ROLE_VALUES)[number];

const ROLE_SET = new Set<string>(USER_ROLE_VALUES);

function isUserRole(value: string): value is UserRole {
  return ROLE_SET.has(value);
}

/** DB satırından rol listesi (roles[] + eski `role` sütunu). */
export function normalizeUserRoles(
  roles: string[] | null | undefined,
  legacyRole?: string | null,
): UserRole[] {
  const set = new Set<UserRole>();

  for (const r of roles ?? []) {
    if (isUserRole(r)) set.add(r);
  }

  if (set.size === 0 && legacyRole && isUserRole(legacyRole)) {
    set.add(legacyRole);
  }

  if (!set.has("user")) set.add("user");

  // Pazaryeri öğrenci akışı: giriş yapmış herkes ilan açabilir / teklif alabilir.
  if (!set.has("student")) set.add("student");

  return USER_ROLE_VALUES.filter((r) => set.has(r));
}

export function hasUserRole(roles: UserRole[], role: UserRole): boolean {
  return roles.includes(role);
}

/** Eski tek-sütun `role` alanı için özet (öncelik: admin > teacher > student > user). */
export function primaryRoleFromRoles(roles: UserRole[]): UserRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("teacher")) return "teacher";
  if (roles.includes("student")) return "student";
  return "user";
}

export function withRoleAdded(roles: UserRole[], role: UserRole): UserRole[] {
  const set = new Set(roles);
  set.add(role);
  if (!set.has("user")) set.add("user");
  if (role !== "admin" && !set.has("student")) set.add("student");
  return normalizeUserRoles(Array.from(set));
}

export function withRoleRemoved(roles: UserRole[], role: UserRole): UserRole[] {
  const set = new Set(roles);
  set.delete(role);
  if (!set.has("user")) set.add("user");
  if (!set.has("student")) set.add("student");
  return normalizeUserRoles(Array.from(set));
}
