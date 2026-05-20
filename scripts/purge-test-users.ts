/**
 * Canlı açılış öncesi test kullanıcılarını temizler (public + auth).
 *
 * Varsayılan: dry-run (sadece listeler). Gerçek silme için --execute.
 *
 *   npm run launch:purge-users
 *   npm run launch:purge-users -- --execute
 *
 * Korunan hesaplar: ADMIN_EMAILS (.env) virgülle ayrılmış e-postalar.
 * Ek koruma: role = 'admin'
 *
 * Gereksinim: .env içinde DATABASE_URL (veya DIRECT_URL), SUPABASE_* anahtarları.
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

import * as schema from "../db/schema";
import { purgeUserFromDatabase } from "../lib/account-purge-db";
import { userProgress, users } from "../db/schema";

config({ path: ".env" });

function parseKeepEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? process.env.PURGE_KEEP_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function main(): Promise<void> {
  const execute = process.argv.includes("--execute");
  const keepEmails = parseKeepEmails();

  if (keepEmails.length === 0) {
    console.error(
      "Hata: ADMIN_EMAILS veya PURGE_KEEP_EMAILS .env içinde tanımlı olmalı (korunacak e-postalar).",
    );
    process.exit(1);
  }

  const connectionString =
    process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error("Hata: DIRECT_URL veya DATABASE_URL gerekli.");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Hata: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
    process.exit(1);
  }

  const pg = new Client({ connectionString });
  await pg.connect();
  const db = drizzle(pg, { schema });

  const keepSet = new Set(keepEmails);

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.created_at,
    })
    .from(users);

  const toPurge = allUsers.filter(
    (u) =>
      u.role !== "admin" &&
      !keepSet.has((u.email ?? "").trim().toLowerCase()),
  );

  const kept = allUsers.filter((u) => !toPurge.some((p) => p.id === u.id));

  console.log("\n=== Korunan hesaplar ===");
  for (const u of kept) {
    console.log(`  KEEP  ${u.email}  (${u.name}, ${u.role})`);
  }

  console.log(`\n=== Silinecek hesaplar (${toPurge.length}) ===`);
  if (toPurge.length === 0) {
    console.log("  (yok)");
  }
  for (const u of toPurge) {
    console.log(`  PURGE ${u.email}  (${u.name}, id=${u.id})`);
  }

  // Auth kullanıcıları profil olmadan (yetim auth)
  const authAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authList, error: listErr } = await authAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listErr) {
    console.error("Auth listUsers hatası:", listErr.message);
    await pg.end();
    process.exit(1);
  }

  const publicIds = new Set(allUsers.map((u) => u.id));
  const orphanAuth =
    authList?.users?.filter((au) => !publicIds.has(au.id)) ?? [];
  const orphanAuthToDelete = orphanAuth.filter(
    (au) => !keepSet.has((au.email ?? "").trim().toLowerCase()),
  );

  if (orphanAuthToDelete.length > 0) {
    console.log(`\n=== Yetim auth.users (${orphanAuthToDelete.length}) ===`);
    for (const au of orphanAuthToDelete) {
      console.log(`  PURGE auth-only ${au.email}  (id=${au.id})`);
    }
  }

  if (!execute) {
    console.log(
      "\nDry-run tamam. Silmek için:\n  npm run launch:purge-users -- --execute\n",
    );
    await pg.end();
    return;
  }

  console.log("\n*** GERÇEK SİLME BAŞLIYOR ***\n");
  let ok = 0;
  let fail = 0;

  for (const u of toPurge) {
    try {
      const progress = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, u.id),
        columns: { schoolId: true, points: true },
      });
      await purgeUserFromDatabase(db, u.id, {
        schoolId: progress?.schoolId ?? null,
        points: progress?.points ?? 0,
      });
      const { error } = await authAdmin.auth.admin.deleteUser(u.id);
      if (error) {
        console.warn(`  WARN auth delete ${u.email}: ${error.message}`);
      }
      console.log(`  OK  ${u.email}`);
      ok++;
    } catch (err) {
      console.error(`  FAIL ${u.email}:`, err instanceof Error ? err.message : err);
      fail++;
    }
  }

  for (const au of orphanAuthToDelete) {
    try {
      const { error } = await authAdmin.auth.admin.deleteUser(au.id);
      if (error) throw new Error(error.message);
      console.log(`  OK  auth-only ${au.email}`);
      ok++;
    } catch (err) {
      console.error(`  FAIL auth-only ${au.email}:`, err instanceof Error ? err.message : err);
      fail++;
    }
  }

  console.log(`\nBitti: ${ok} başarılı, ${fail} hata.`);
  console.log("Sonra: npm run launch:post-cleanup\n");
  await pg.end();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
