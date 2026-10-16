/**
 * data/fikirler.json kursunu veritabanına yazar.
 * Aynı başlık varsa ikinci kez eklemez.
 */
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { Client } from "pg";

config({ path: ".env" });
config({ path: ".env.local", override: true });

type Option = { text?: string; correct: boolean };
type Challenge = {
  question: string;
  type: string;
  difficulty?: string;
  tags?: string;
  explanation?: string;
  metadata?: string;
  options: Option[];
};
type Lesson = { title: string; order: number; challenges: Challenge[] };
type Unit = { title: string; description: string; order: number; lessons: Lesson[] };
type Payload = { course: { title: string; imageSrc?: string; section?: string }; units: Unit[] };

function sessionPoolerUrl(databaseUrl?: string): string | null {
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

async function connect(): Promise<Client> {
  const direct = process.env.DIRECT_URL?.trim();
  const pooled = sessionPoolerUrl(process.env.DATABASE_URL) || process.env.DATABASE_URL?.trim();
  const candidates = [direct, pooled].filter((value, index, all): value is string =>
    Boolean(value) && all.indexOf(value) === index,
  );
  if (candidates.length === 0) {
    throw new Error("DIRECT_URL veya DATABASE_URL yok.");
  }

  let lastError: unknown;
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

async function main() {

  const raw = fs.readFileSync(path.join(process.cwd(), "data/aliskanliklar.json"), "utf8");
  const data = JSON.parse(raw) as Payload;

  const client = await connect();

  try {
    const existing = await client.query<{ id: number }>(
      "SELECT id FROM courses WHERE title = $1 LIMIT 1",
      [data.course.title],
    );
    if (existing.rows[0]) {
      console.log(`Zaten var: ${data.course.title} (id ${existing.rows[0].id})`);
      return;
    }

    await client.query("BEGIN");
    const course = await client.query<{ id: number }>(
      "INSERT INTO courses (title, image_src, section) VALUES ($1, $2, $3) RETURNING id",
      [data.course.title, data.course.imageSrc || "/courses/genel-kultur.svg", data.course.section ?? null],
    );
    const courseId = course.rows[0].id;
    let lessonCount = 0;
    let challengeCount = 0;

    for (const unit of data.units) {
      const unitRow = await client.query<{ id: number }>(
        "INSERT INTO units (title, description, course_id, \"order\") VALUES ($1, $2, $3, $4) RETURNING id",
        [unit.title, unit.description, courseId, unit.order],
      );
      const unitId = unitRow.rows[0].id;

      for (const lesson of unit.lessons) {
        const lessonRow = await client.query<{ id: number }>(
          "INSERT INTO lessons (title, unit_id, \"order\") VALUES ($1, $2, $3) RETURNING id",
          [lesson.title, unitId, lesson.order],
        );
        const lessonId = lessonRow.rows[0].id;
        lessonCount++;

        for (let i = 0; i < lesson.challenges.length; i++) {
          const challenge = lesson.challenges[i];
          const challengeRow = await client.query<{ id: number }>(
            `INSERT INTO challenges
              (lesson_id, type, question, explanation, "order", difficulty, tags, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
              lessonId,
              challenge.type,
              challenge.question,
              challenge.explanation ?? null,
              i + 1,
              challenge.difficulty ?? null,
              challenge.tags ?? null,
              challenge.metadata ?? null,
            ],
          );
          const challengeId = challengeRow.rows[0].id;
          challengeCount++;

          for (const option of challenge.options) {
            await client.query(
              `INSERT INTO challenge_options (challenge_id, text, correct)
               VALUES ($1, $2, $3)`,
              [challengeId, option.text ?? "", option.correct],
            );
          }
        }
      }
    }

    await client.query("COMMIT");
    console.log(
      `Eklendi: ${data.course.title} id=${courseId} ders=${lessonCount} soru=${challengeCount}`,
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
