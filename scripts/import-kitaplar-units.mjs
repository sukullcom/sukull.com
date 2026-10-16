/**
 * Yazılmış üniteleri Kitaplar bölümündeki kurslara ekler.
 * Ünite varsa ikinci kez yazmaz.
 */
import { config } from "dotenv";
import fs from "fs";
import path from "path";
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

async function ensureCourse(client, title) {
  const existing = await client.query("SELECT id FROM courses WHERE title = $1 LIMIT 1", [title]);
  if (existing.rows[0]) {
    await client.query("UPDATE courses SET section = 'kitaplar' WHERE id = $1 AND section IS DISTINCT FROM 'kitaplar'", [
      existing.rows[0].id,
    ]);
    return existing.rows[0].id;
  }
  const created = await client.query(
    "INSERT INTO courses (title, image_src, section) VALUES ($1, $2, 'kitaplar') RETURNING id",
    [title, "/courses/genel-kultur.svg"],
  );
  console.log(`Kurs açıldı: ${title} id=${created.rows[0].id}`);
  return created.rows[0].id;
}

async function insertUnit(client, courseId, unit) {
  const existing = await client.query(
    "SELECT id FROM units WHERE course_id = $1 AND title = $2 LIMIT 1",
    [courseId, unit.title],
  );
  if (existing.rows[0]) {
    console.log(`Ünite var: ${unit.title}`);
    return;
  }

  await client.query("BEGIN");
  try {
    await client.query(
      `UPDATE units SET "order" = "order" + 1 WHERE course_id = $1 AND "order" >= $2`,
      [courseId, unit.order],
    );
    const unitRow = await client.query(
      'INSERT INTO units (title, description, course_id, "order") VALUES ($1, $2, $3, $4) RETURNING id',
      [unit.title, unit.description, courseId, unit.order],
    );
    const unitId = unitRow.rows[0].id;
    let challengeCount = 0;
    for (const lesson of unit.lessons) {
      const lessonRow = await client.query(
        'INSERT INTO lessons (title, unit_id, "order") VALUES ($1, $2, $3) RETURNING id',
        [lesson.title, unitId, lesson.order],
      );
      for (let i = 0; i < lesson.challenges.length; i++) {
        const challenge = lesson.challenges[i];
        const challengeRow = await client.query(
          `INSERT INTO challenges
            (lesson_id, type, question, explanation, "order", difficulty, tags, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            lessonRow.rows[0].id,
            challenge.type,
            challenge.question,
            challenge.explanation ?? null,
            i + 1,
            challenge.difficulty ?? null,
            challenge.tags ?? null,
            challenge.metadata ?? null,
          ],
        );
        challengeCount++;
        for (const option of challenge.options) {
          await client.query(
            "INSERT INTO challenge_options (challenge_id, text, correct) VALUES ($1, $2, $3)",
            [challengeRow.rows[0].id, option.text ?? "", option.correct],
          );
        }
      }
    }
    await client.query("COMMIT");
    console.log(`Eklendi: ${unit.title} ders=${unit.lessons.length} soru=${challengeCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function setOrders(client, courseTitle, titles) {
  const course = await client.query("SELECT id FROM courses WHERE title = $1 LIMIT 1", [courseTitle]);
  const courseId = course.rows[0]?.id;
  if (!courseId) return;
  for (let i = 0; i < titles.length; i++) {
    await client.query(
      `UPDATE units SET "order" = $3 WHERE course_id = $1 AND title = $2`,
      [courseId, titles[i], i + 1],
    );
  }
}

async function main() {
  const client = await connect();
  try {
    const dusunce = await ensureCourse(client, "Düşünce kitapları");
    for (const file of ["data/dil-belasi.json", "data/aliskanligin-gucu.json", "data/zirve.json"]) {
      const unit = JSON.parse(fs.readFileSync(path.join(process.cwd(), file), "utf8"));
      await insertUnit(client, dusunce, unit);
    }
    await setOrders(client, "Düşünce kitapları", [
      "Atomik Alışkanlıklar",
      "Çizginin Dışındakiler",
      "Dil Belası",
      "Ey Oğul",
      "Alışkanlığın Gücü",
      "Zirve",
    ]);

    const islamiyet = await ensureCourse(client, "İslamiyet");
    const peygamberler = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/peygamberler.json"), "utf8"));
    await insertUnit(client, islamiyet, peygamberler);
    await setOrders(client, "İslamiyet", ["Kur'an", "Hadisler", "Ashab-ı Kehf", "Peygamberler"]);

    const deneyler = await ensureCourse(client, "Deneyler");
    for (const file of ["data/milgram.json", "data/asch.json", "data/bilissel-celiski.json"]) {
      const unit = JSON.parse(fs.readFileSync(path.join(process.cwd(), file), "utf8"));
      await insertUnit(client, deneyler, unit);
    }
    await setOrders(client, "Deneyler", ["Milgram deneyi", "Asch’ın çizgi deneyi", "Bilişsel çelişki"]);

    const rows = await client.query(
      `SELECT c.title AS course, u."order", u.title AS unit, count(l.id)::int AS lessons, count(ch.id)::int AS questions
       FROM courses c
       JOIN units u ON u.course_id = c.id
       JOIN lessons l ON l.unit_id = u.id
       JOIN challenges ch ON ch.lesson_id = l.id
       WHERE c.section = 'kitaplar'
       GROUP BY c.title, u."order", u.title
       ORDER BY c.title, u."order"`,
    );
    console.log(JSON.stringify(rows.rows, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
