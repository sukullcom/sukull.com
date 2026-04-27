/**
 * auth.users (Supabase) ile aynı id'ye sahip public.users satırı.
 * OAuth / callback API route'unda tarayıcı Supabase client'ına güvenmek
 * PKCE yok, RLS veya context nedeniyle başarısız olabiliyor; bu yüzden
 * sunucu tarafında Drizzle ile eklenir.
 */
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

export async function ensurePublicUserFromAuth(
  authUser: User,
  overrideUsername?: string
) {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
  });
  if (existing) {
    return existing;
  }

  const provider = (authUser.app_metadata?.provider as string) || "email";
  let name: string | undefined = overrideUsername;
  let avatar = "/mascot_purple.svg";

  if (!name) {
    if (provider === "google") {
      const googleName =
        (authUser.user_metadata?.name as string | undefined) ||
        (authUser.user_metadata?.full_name as string | undefined);
      if (googleName) {
        name = googleName;
      }
      avatar =
        (authUser.user_metadata?.avatar_url as string) ||
        `https://api.dicebear.com/9.x/bottts/svg?seed=${authUser.id}`;
    } else {
      name =
        (authUser.user_metadata?.full_name as string | undefined) ||
        authUser.email?.split("@")[0] ||
        "User";
    }
  }

  const email = authUser.email || "";
  const finalName = (name || email.split("@")[0] || "User") as string;

  await db
    .insert(users)
    .values({
      id: authUser.id,
      email,
      name: finalName,
      avatar,
      provider,
      description: "",
      links: [],
    })
    .onConflictDoNothing({ target: users.id });

  const row = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
  });
  return row ?? null;
}
