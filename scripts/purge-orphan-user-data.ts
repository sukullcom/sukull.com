/**
 * `public.users` dışında kalan kullanıcı verilerini temizler.
 *
 * Purge "silinecek yok" derse bile challenge_progress vb. tablolarda
 * eski test user_id'leri kalabilir (FK yok veya kısmi silme).
 *
 *   npm run launch:purge-orphans              # dry-run: sayılar
 *   npm run launch:purge-orphans -- --execute # yetim satırları sil
 *   npm run launch:purge-orphans -- --execute --wipe-all
 *     # TÜM kullanıcı aktivite tablolarını boşaltır (users + okullar + dersler kalır)
 */
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env" });

type Step = { name: string; countSql: string; deleteSql: string; /** Yoksa atlama için */ table?: string };

const ORPHAN_STEPS: Step[] = [
  {
    name: "challenge_progress",
    countSql: `SELECT COUNT(*)::int FROM public.challenge_progress WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.challenge_progress WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "user_daily_streak",
    countSql: `SELECT COUNT(*)::int FROM public.user_daily_streak WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.user_daily_streak WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "user_daily_challenges",
    countSql: `SELECT COUNT(*)::int FROM public.user_daily_challenges WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.user_daily_challenges WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "snippets",
    countSql: `SELECT COUNT(*)::int FROM public.snippets WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.snippets WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "teacher_applications",
    countSql: `SELECT COUNT(*)::int FROM public.teacher_applications WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.teacher_applications WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "activity_log",
    countSql: `SELECT COUNT(*)::int FROM public.activity_log WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.activity_log WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "listing_offers",
    countSql: `SELECT COUNT(*)::int FROM public.listing_offers WHERE teacher_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.listing_offers WHERE teacher_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "listings",
    countSql: `SELECT COUNT(*)::int FROM public.listings WHERE student_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.listings WHERE student_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "message_unlocks",
    countSql: `SELECT COUNT(*)::int FROM public.message_unlocks
      WHERE student_id NOT IN (SELECT id FROM public.users)
         OR teacher_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.message_unlocks
      WHERE student_id NOT IN (SELECT id FROM public.users)
         OR teacher_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "study_buddy_posts",
    countSql: `SELECT COUNT(*)::int FROM public.study_buddy_posts WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.study_buddy_posts WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "study_buddy_messages",
    countSql: `SELECT COUNT(*)::int FROM public.study_buddy_messages WHERE sender NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.study_buddy_messages WHERE sender NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "study_buddy_chats (yetim katılımcı)",
    countSql: `SELECT COUNT(*)::int FROM public.study_buddy_chats c
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(c.participants) AS p(elem)
        WHERE p.elem NOT IN (SELECT id FROM public.users)
      )`,
    deleteSql: `DELETE FROM public.study_buddy_chats c
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(c.participants) AS p(elem)
        WHERE p.elem NOT IN (SELECT id FROM public.users)
      )`,
  },
  {
    name: "user_progress",
    countSql: `SELECT COUNT(*)::int FROM public.user_progress WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.user_progress WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "user_credits",
    countSql: `SELECT COUNT(*)::int FROM public.user_credits WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.user_credits WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "credit_transactions",
    countSql: `SELECT COUNT(*)::int FROM public.credit_transactions WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.credit_transactions WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "payment_logs",
    countSql: `SELECT COUNT(*)::int FROM public.payment_logs WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.payment_logs WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
  {
    name: "user_subscriptions",
    countSql: `SELECT COUNT(*)::int FROM public.user_subscriptions WHERE user_id NOT IN (SELECT id FROM public.users)`,
    deleteSql: `DELETE FROM public.user_subscriptions WHERE user_id NOT IN (SELECT id FROM public.users)`,
  },
];

/** Canlı öncesi tam sıfır: users satırları kalır, tüm aktivite/ödeme/study verisi gider. */
const WIPE_ALL_STEPS: Step[] = [
  { name: "challenge_progress (tümü)", table: "challenge_progress", countSql: `SELECT COUNT(*)::int FROM public.challenge_progress`, deleteSql: `DELETE FROM public.challenge_progress` },
  { name: "user_daily_streak (tümü)", table: "user_daily_streak", countSql: `SELECT COUNT(*)::int FROM public.user_daily_streak`, deleteSql: `DELETE FROM public.user_daily_streak` },
  { name: "user_daily_challenges (tümü)", table: "user_daily_challenges", countSql: `SELECT COUNT(*)::int FROM public.user_daily_challenges`, deleteSql: `DELETE FROM public.user_daily_challenges` },
  { name: "snippets (tümü)", table: "snippets", countSql: `SELECT COUNT(*)::int FROM public.snippets`, deleteSql: `DELETE FROM public.snippets` },
  { name: "teacher_applications (tümü)", table: "teacher_applications", countSql: `SELECT COUNT(*)::int FROM public.teacher_applications`, deleteSql: `DELETE FROM public.teacher_applications` },
  { name: "activity_log (tümü)", table: "activity_log", countSql: `SELECT COUNT(*)::int FROM public.activity_log`, deleteSql: `DELETE FROM public.activity_log` },
  { name: "listing_offers (tümü)", table: "listing_offers", countSql: `SELECT COUNT(*)::int FROM public.listing_offers`, deleteSql: `DELETE FROM public.listing_offers` },
  { name: "listings (tümü)", table: "listings", countSql: `SELECT COUNT(*)::int FROM public.listings`, deleteSql: `DELETE FROM public.listings` },
  { name: "message_unlocks (tümü)", table: "message_unlocks", countSql: `SELECT COUNT(*)::int FROM public.message_unlocks`, deleteSql: `DELETE FROM public.message_unlocks` },
  { name: "study_buddy_messages (tümü)", table: "study_buddy_messages", countSql: `SELECT COUNT(*)::int FROM public.study_buddy_messages`, deleteSql: `DELETE FROM public.study_buddy_messages` },
  { name: "study_buddy_posts (tümü)", table: "study_buddy_posts", countSql: `SELECT COUNT(*)::int FROM public.study_buddy_posts`, deleteSql: `DELETE FROM public.study_buddy_posts` },
  { name: "study_buddy_chats (tümü)", table: "study_buddy_chats", countSql: `SELECT COUNT(*)::int FROM public.study_buddy_chats`, deleteSql: `DELETE FROM public.study_buddy_chats` },
  { name: "user_progress (tümü)", table: "user_progress", countSql: `SELECT COUNT(*)::int FROM public.user_progress`, deleteSql: `DELETE FROM public.user_progress` },
  { name: "user_credits (tümü)", table: "user_credits", countSql: `SELECT COUNT(*)::int FROM public.user_credits`, deleteSql: `DELETE FROM public.user_credits` },
  { name: "credit_transactions (tümü)", table: "credit_transactions", countSql: `SELECT COUNT(*)::int FROM public.credit_transactions`, deleteSql: `DELETE FROM public.credit_transactions` },
  { name: "payment_logs (tümü)", table: "payment_logs", countSql: `SELECT COUNT(*)::int FROM public.payment_logs`, deleteSql: `DELETE FROM public.payment_logs` },
  { name: "user_subscriptions (tümü)", table: "user_subscriptions", countSql: `SELECT COUNT(*)::int FROM public.user_subscriptions`, deleteSql: `DELETE FROM public.user_subscriptions` },
  {
    name: "referral_rewards (tümü)",
    table: "referral_rewards",
    countSql: `SELECT COUNT(*)::int FROM public.referral_rewards`,
    deleteSql: `DELETE FROM public.referral_rewards`,
  },
  {
    name: "error_log (tümü)",
    table: "error_log",
    countSql: `SELECT COUNT(*)::int FROM public.error_log`,
    deleteSql: `DELETE FROM public.error_log`,
  },
  {
    name: "activity_log_daily (tümü)",
    table: "activity_log_daily",
    countSql: `SELECT COUNT(*)::int FROM public.activity_log_daily`,
    deleteSql: `DELETE FROM public.activity_log_daily`,
  },
  {
    name: "admin_audit (tümü)",
    table: "admin_audit",
    countSql: `SELECT COUNT(*)::int FROM public.admin_audit`,
    deleteSql: `DELETE FROM public.admin_audit`,
  },
];

async function tableExists(client: Client, table: string): Promise<boolean> {
  const r = await client.query(`SELECT to_regclass($1) IS NOT NULL AS ok`, [`public.${table}`]);
  return Boolean(r.rows[0]?.ok);
}

async function runSteps(
  client: Client,
  steps: Step[],
  execute: boolean,
): Promise<void> {
  let total = 0;
  let stepIndex = 0;
  for (const step of steps) {
    if (step.table && !(await tableExists(client, step.table))) {
      console.log(`  ATLA  ${step.name} (tablo yok: ${step.table})`);
      continue;
    }

    const sp = `sp_${stepIndex++}`;
    if (execute) await client.query(`SAVEPOINT ${sp}`);

    try {
      const countRes = await client.query(step.countSql);
      const n = Number(countRes.rows[0]?.count ?? countRes.rows[0]?.c ?? 0);
      if (n > 0) {
        console.log(`  ${execute ? "SİL" : "SAY"}  ${step.name}: ${n}`);
        total += n;
      }
      if (execute && n > 0) {
        await client.query(step.deleteSql);
      }
      if (execute) await client.query(`RELEASE SAVEPOINT ${sp}`);
    } catch (err) {
      if (execute) await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  HATA ${step.name}: ${msg}`);
      throw err;
    }
  }
  console.log(`\nToplam etkilenen satır (yaklaşık): ${total}`);
}

async function main(): Promise<void> {
  const execute = process.argv.includes("--execute");
  const wipeAll = process.argv.includes("--wipe-all");

  const connectionString =
    process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error("Hata: DIRECT_URL veya DATABASE_URL gerekli.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  const usersRes = await client.query(`SELECT COUNT(*)::int AS c FROM public.users`);
  const userCount = Number(usersRes.rows[0]?.c ?? 0);
  console.log(`\npublic.users kayıt sayısı: ${userCount}`);
  console.log(
    wipeAll
      ? "\nMod: --wipe-all (TÜM kullanıcı aktivitesi silinir, users + okullar + dersler kalır)"
      : "\nMod: yetim satırlar (user_id ∉ users)",
  );

  if (!execute) {
    console.log("\nDry-run. Silmek için:\n  npm run launch:purge-orphans -- --execute");
    if (!wipeAll) {
      console.log("Tam sıfır için:\n  npm run launch:purge-orphans -- --execute --wipe-all\n");
    }
  } else {
    console.log("\n*** GERÇEK SİLME ***\n");
    await client.query("BEGIN");
  }

  try {
    await runSteps(client, wipeAll ? WIPE_ALL_STEPS : ORPHAN_STEPS, execute);

    if (execute) {
      await client.query(
        `UPDATE public.schools s SET total_points = COALESCE((
          SELECT SUM(up.points)::int FROM public.user_progress up WHERE up.school_id = s.id
        ), 0)`,
      );
      await client.query("COMMIT");
      console.log("\nOkul total_points yeniden hesaplandı.");
      console.log("İsteğe bağlı: npm run launch:post-cleanup\n");
    }
  } catch (err) {
    if (execute) await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
