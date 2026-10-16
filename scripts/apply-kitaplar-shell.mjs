/**
 * Parçalı rafları tek Kitaplar bölümünde toplar.
 * Üniteleri taşır, boş kurs kabuklarını siler.
 * Genel Kültür ve Dikkat ve çalışma silinmeden önce aktif kurs boşaltılır.
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const { Client } = pg;

function sessionPoolerUrl(databaseUrl) {
  const raw = databaseUrl?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!parsed.hostname.includes("pooler.supabase.com")) return null;
    parsed.port = "5432";
    return parsed.toString();
  } catch {
    return null;
  }
}

async function connect() {
  const direct = process.env.DIRECT_URL?.trim();
  const pooled = sessionPoolerUrl(process.env.DATABASE_URL) || process.env.DATABASE_URL?.trim();
  const candidates = [direct, pooled].filter((value, index, all) => Boolean(value) && all.indexOf(value) === index);
  if (candidates.length === 0) throw new Error("DIRECT_URL veya DATABASE_URL yok.");

  let lastError;
  for (const url of candidates) {
    const client = new Client({
      connectionString: url,
      ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    });
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => undefined);
    }
  }
  throw lastError;
}

async function courseId(client, title) {
  const row = await client.query("SELECT id FROM courses WHERE title = $1 LIMIT 1", [title]);
  return row.rows[0]?.id ?? null;
}

async function retargetUsers(client, fromId, toId) {
  if (!fromId || fromId === toId) return 0;
  const res = await client.query(
    "UPDATE user_progress SET active_course_id = $2 WHERE active_course_id = $1",
    [fromId, toId],
  );
  return res.rowCount;
}

async function retargetMastery(client, fromId, toId) {
  if (!fromId || fromId === toId) return;
  const exists = await client.query("SELECT to_regclass('public.concept_mastery') AS name");
  if (!exists.rows[0]?.name) return;
  await client.query(
    `DELETE FROM concept_mastery old
     USING concept_mastery kept
     WHERE old.course_id = $1
       AND kept.course_id = $2
       AND kept.user_id = old.user_id
       AND kept.concept_key = old.concept_key`,
    [fromId, toId],
  );
  await client.query("UPDATE concept_mastery SET course_id = $2 WHERE course_id = $1", [fromId, toId]);
}

async function deleteCourse(client, id) {
  if (!id) return;
  await client.query("UPDATE user_progress SET active_course_id = NULL WHERE active_course_id = $1", [id]);
  await client.query("DELETE FROM courses WHERE id = $1", [id]);
}

async function main() {
  const client = await connect();
  try {
    await client.query("BEGIN");

    let dusunce = await courseId(client, "Düşünce kitapları");
    const alis = await courseId(client, "Alışkanlıklar");
    if (!dusunce && alis) {
      await client.query(
        "UPDATE courses SET title = 'Düşünce kitapları', section = 'kitaplar' WHERE id = $1",
        [alis],
      );
      dusunce = alis;
    } else if (dusunce) {
      await client.query("UPDATE courses SET section = 'kitaplar' WHERE id = $1", [dusunce]);
      if (alis && alis !== dusunce) {
        await client.query("UPDATE units SET course_id = $2 WHERE course_id = $1", [alis, dusunce]);
        await retargetUsers(client, alis, dusunce);
        await retargetMastery(client, alis, dusunce);
        await deleteCourse(client, alis);
      }
    }
    if (!dusunce) throw new Error("Düşünce kitapları kursu bulunamadı.");

    const basari = await courseId(client, "Başarı ve çevre");
    if (basari) {
      await client.query(
        `UPDATE units SET course_id = $2, "order" = 2
         WHERE course_id = $1 AND title = 'Çizginin Dışındakiler'`,
        [basari, dusunce],
      );
      await retargetUsers(client, basari, dusunce);
      await retargetMastery(client, basari, dusunce);
      await deleteCourse(client, basari);
    }

    const gazali = await courseId(client, "Gazali");
    if (gazali) {
      await client.query(
        `UPDATE units SET course_id = $2, "order" = 3
         WHERE course_id = $1 AND title = 'Ey Oğul'`,
        [gazali, dusunce],
      );
      await retargetUsers(client, gazali, dusunce);
      await retargetMastery(client, gazali, dusunce);
      await deleteCourse(client, gazali);
    }

    await client.query(
      `UPDATE units SET "order" = 1 WHERE course_id = $1 AND title = 'Atomik Alışkanlıklar'`,
      [dusunce],
    );

    let islamiyet = await courseId(client, "İslamiyet");
    const kuran = await courseId(client, "Kur'an");
    if (!islamiyet && kuran) {
      await client.query(
        "UPDATE courses SET title = 'İslamiyet', section = 'kitaplar' WHERE id = $1",
        [kuran],
      );
      islamiyet = kuran;
    } else if (islamiyet) {
      await client.query("UPDATE courses SET section = 'kitaplar' WHERE id = $1", [islamiyet]);
      if (kuran && kuran !== islamiyet) {
        await client.query("UPDATE units SET course_id = $2 WHERE course_id = $1", [kuran, islamiyet]);
        await retargetUsers(client, kuran, islamiyet);
        await retargetMastery(client, kuran, islamiyet);
        await deleteCourse(client, kuran);
      }
    }
    if (!islamiyet) throw new Error("İslamiyet kursu bulunamadı.");

    await client.query(
      `UPDATE units SET title = 'Kur''an', "order" = 1
       WHERE course_id = $1 AND title = 'Namaz sureleri'`,
      [islamiyet],
    );
    await client.query(
      `UPDATE units SET "order" = 1 WHERE course_id = $1 AND title = 'Kur''an'`,
      [islamiyet],
    );

    const hadis = await courseId(client, "Hadisler");
    if (hadis && hadis !== islamiyet) {
      await client.query(
        `UPDATE units SET course_id = $2, title = 'Hadisler', "order" = 2
         WHERE course_id = $1 AND title IN ('Niyet ve amel', 'Hadisler')`,
        [hadis, islamiyet],
      );
      await retargetUsers(client, hadis, islamiyet);
      await retargetMastery(client, hadis, islamiyet);
      await deleteCourse(client, hadis);
    }

    const kissalar = await courseId(client, "Kıssalar");
    if (kissalar && kissalar !== islamiyet) {
      await client.query(
        `UPDATE units SET course_id = $2, "order" = 3
         WHERE course_id = $1 AND title = 'Ashab-ı Kehf'`,
        [kissalar, islamiyet],
      );
      await retargetUsers(client, kissalar, islamiyet);
      await retargetMastery(client, kissalar, islamiyet);
      await deleteCourse(client, kissalar);
    }

    for (const title of ["Genel Kültür", "Dikkat ve çalışma"]) {
      const id = await courseId(client, title);
      if (id) {
        console.log(`Siliniyor: ${title} id=${id}`);
        await deleteCourse(client, id);
      }
    }

    await client.query("COMMIT");

    const rows = await client.query(
      `SELECT c.id, c.title, c.section, u."order", u.title AS unit
       FROM courses c
       LEFT JOIN units u ON u.course_id = c.id
       WHERE c.section = 'kitaplar' OR c.title IN ('Genel Kültür', 'Dikkat ve çalışma', 'Alışkanlıklar', 'Başarı ve çevre', 'Gazali', 'Kur''an', 'Hadisler', 'Kıssalar')
       ORDER BY c.title, u."order"`,
    );
    console.log(JSON.stringify(rows.rows, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
