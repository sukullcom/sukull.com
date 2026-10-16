/**
 * Herkese açık rafları yazar.
 * Bölüm sütununu ekler, Fikirler kursunu Alışkanlıklar yapar,
 * Genel Kültür'ü kendi rafına alır, yeni kursları yoksa ekler.
 */
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import pg from "pg";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const { Client } = pg;

const FILES = [
  "data/basari-ve-cevre.json",
  "data/kuran.json",
  "data/hadisler.json",
  "data/kissalar.json",
  "data/gazali.json",
  "data/dikkat-ve-calisma.json",
];

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

async function refreshReadings(client, courseId, data) {
  let updated = 0;
  for (const unit of data.units) {
    for (const lesson of unit.lessons) {
      for (const challenge of lesson.challenges) {
        const res = await client.query(
          `UPDATE challenges c
           SET metadata = $1
           FROM lessons l
           JOIN units u ON u.id = l.unit_id
           WHERE c.lesson_id = l.id
             AND u.course_id = $2
             AND l.title = $3
             AND c.question = $4
             AND c.metadata IS DISTINCT FROM $1`,
          [challenge.metadata ?? null, courseId, lesson.title, challenge.question],
        );
        updated += res.rowCount;
      }
    }
  }
  return updated;
}

async function importCourse(client, data) {
  const existing = await client.query("SELECT id FROM courses WHERE title = $1 LIMIT 1", [data.course.title]);
  if (existing.rows[0]) {
    await client.query("UPDATE courses SET section = $2 WHERE id = $1 AND section IS DISTINCT FROM $2", [
      existing.rows[0].id,
      data.course.section ?? null,
    ]);
    const updated = await refreshReadings(client, existing.rows[0].id, data);
    console.log(`Zaten var: ${data.course.title} (id ${existing.rows[0].id}) okuma=${updated}`);
    return;
  }

  await client.query("BEGIN");
  try {
    const course = await client.query(
      "INSERT INTO courses (title, image_src, section) VALUES ($1, $2, $3) RETURNING id",
      [data.course.title, data.course.imageSrc || "/courses/genel-kultur.svg", data.course.section ?? null],
    );
    const courseId = course.rows[0].id;
    let lessonCount = 0;
    let challengeCount = 0;

    for (const unit of data.units) {
      const unitRow = await client.query(
        'INSERT INTO units (title, description, course_id, "order") VALUES ($1, $2, $3, $4) RETURNING id',
        [unit.title, unit.description, courseId, unit.order],
      );
      const unitId = unitRow.rows[0].id;
      for (const lesson of unit.lessons) {
        const lessonRow = await client.query(
          'INSERT INTO lessons (title, unit_id, "order") VALUES ($1, $2, $3) RETURNING id',
          [lesson.title, unitId, lesson.order],
        );
        lessonCount++;
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
    }
    await client.query("COMMIT");
    console.log(`Eklendi: ${data.course.title} id=${courseId} ders=${lessonCount} soru=${challengeCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  console.error("Bu betik eski rafları geri açar. Kitaplar bölümü scripts/apply-kitaplar-shell.mjs ile kurulur.");
  process.exit(1);
  const client = await connect();
  try {
    await client.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS section text");

    const renamed = await client.query(
      "UPDATE courses SET title = 'Alışkanlıklar', section = 'dusunce' WHERE title = 'Fikirler' RETURNING id",
    );
    console.log(`Fikirler yeniden adlandırıldı: ${renamed.rowCount}`);

    const habits = await client.query(
      "UPDATE courses SET section = 'dusunce' WHERE title = 'Alışkanlıklar' AND section IS DISTINCT FROM 'dusunce' RETURNING id",
    );
    console.log(`Alışkanlıklar bölümü: ${habits.rowCount}`);

    const culture = await client.query(
      "UPDATE courses SET section = 'genel_kultur' WHERE title = 'Genel Kültür' RETURNING id",
    );
    console.log(`Genel Kültür rafı: ${culture.rowCount}`);

    for (const file of FILES) {
      const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), file), "utf8"));
      await importCourse(client, data);
    }

    const rows = await client.query(
      `SELECT c.id, c.title, c.section,
              (SELECT count(*) FROM units u WHERE u.course_id = c.id) AS units,
              (SELECT count(*) FROM lessons l JOIN units u ON u.id = l.unit_id WHERE u.course_id = c.id) AS lessons
       FROM courses c
       WHERE c.section IS NOT NULL
       ORDER BY c.section, c.title`,
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
