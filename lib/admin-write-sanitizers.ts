/**
 * Admin-facing write sanitizers for the content tables (courses, units,
 * lessons, challenges, challenge_options).
 *
 * ## Why this exists
 *
 * Every admin CRUD route in this repo historically called
 * `db.insert(table).values({ ...body })` or
 * `db.update(table).set({ ...body })`. That pattern is:
 *
 *   - Safe today — the Drizzle schema for these tables is narrow
 *     (serial id + a handful of content columns) and Drizzle itself
 *     ignores keys that aren't columns.
 *   - **Brittle tomorrow** — as soon as a migration adds a sensitive
 *     column (think `is_system`, `owner_id`, `created_by`, a future
 *     `published_at`) the same spread will silently accept it. The
 *     attack path ("admin token leaked, and now any future-added
 *     column can be overwritten via a JSON POST") is a realistic
 *     defence-in-depth concern: admin sessions are long-lived and
 *     high-privilege, so their write surface should be explicit.
 *
 * Each sanitizer:
 *   1. Coerces primitive types safely (strings trimmed, numbers via
 *      `Number.isFinite`, booleans strict).
 *   2. Drops keys not in the allow-list.
 *   3. Returns `{ ok: true, values }` or `{ ok: false, error }` so the
 *      caller can decide between 400 / 422 / merge-into-existing.
 *
 * The sanitizers deliberately return *partial* objects for `update`
 * call sites (Drizzle `.set(...)` tolerates undefined keys) so admin
 * forms can do field-level edits without resubmitting the whole row.
 */

type Result<T> = { ok: true; values: T } | { ok: false; error: string };

function str(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length > 0 ? s : undefined;
}

function strOrNull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

function int(v: unknown): number | undefined {
  if (v === undefined) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function intOrNull(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function bool(v: unknown): boolean | undefined {
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  return undefined;
}

// ---------------------------------------------------------------------------
// Courses — { title, imageSrc }
// ---------------------------------------------------------------------------

export type CourseWrite = { title?: string; imageSrc?: string };

export function sanitizeCourseWrite(body: unknown, mode: "create" | "update"): Result<CourseWrite> {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;
  const out: CourseWrite = {
    title: str(b.title),
    imageSrc: str(b.imageSrc),
  };
  if (mode === "create" && (!out.title || !out.imageSrc)) {
    return { ok: false, error: "title and imageSrc are required" };
  }
  return { ok: true, values: out };
}

// ---------------------------------------------------------------------------
// Units — { title, description, courseId, order }
// ---------------------------------------------------------------------------

export type UnitWrite = { title?: string; description?: string; courseId?: number; order?: number };

export function sanitizeUnitWrite(body: unknown, mode: "create" | "update"): Result<UnitWrite> {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;
  const out: UnitWrite = {
    title: str(b.title),
    description: str(b.description),
    courseId: int(b.courseId),
    order: int(b.order),
  };
  if (mode === "create") {
    if (!out.title || !out.description || out.courseId === undefined || out.order === undefined) {
      return { ok: false, error: "title, description, courseId, order are required" };
    }
  }
  return { ok: true, values: out };
}

// ---------------------------------------------------------------------------
// Lessons — { title, unitId, order }
// ---------------------------------------------------------------------------

export type LessonWrite = { title?: string; unitId?: number; order?: number };

export function sanitizeLessonWrite(body: unknown, mode: "create" | "update"): Result<LessonWrite> {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;
  const out: LessonWrite = {
    title: str(b.title),
    unitId: int(b.unitId),
    order: int(b.order),
  };
  if (mode === "create") {
    if (!out.title || out.unitId === undefined || out.order === undefined) {
      return { ok: false, error: "title, unitId, order are required" };
    }
  }
  return { ok: true, values: out };
}

// ---------------------------------------------------------------------------
// Challenges — narrow to exactly the schema columns used by the admin
// form, intentionally excluding `id` so callers can't reassign the
// primary key via PUT body.
// ---------------------------------------------------------------------------

export type ChallengeWrite = {
  lessonId?: number;
  type?: string;
  question?: string;
  questionImageSrc?: string | null;
  explanation?: string | null;
  order?: number;
  difficulty?: string | null;
  tags?: string | null;
  timeLimit?: number | null;
  metadata?: string | null;
};

export function sanitizeChallengeWrite(body: unknown, mode: "create" | "update"): Result<ChallengeWrite> {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;
  const out: ChallengeWrite = {
    lessonId: int(b.lessonId),
    type: str(b.type),
    question: str(b.question),
    questionImageSrc: strOrNull(b.questionImageSrc),
    explanation: strOrNull(b.explanation),
    order: int(b.order),
    difficulty: strOrNull(b.difficulty),
    tags: strOrNull(b.tags),
    timeLimit: intOrNull(b.timeLimit),
    metadata: strOrNull(b.metadata),
  };
  if (mode === "create") {
    if (out.lessonId === undefined || !out.type || !out.question || out.order === undefined) {
      return { ok: false, error: "lessonId, type, question, order are required" };
    }
  }
  return { ok: true, values: out };
}

// ---------------------------------------------------------------------------
// Challenge options — mirror the inline list already in
// `app/api/challengeOptions/route.ts` so callers through the
// consolidated `/api/lessons?action=*` path get the same treatment.
// ---------------------------------------------------------------------------

export type ChallengeOptionWrite = {
  challengeId?: number;
  text?: string;
  correct?: boolean;
  imageSrc?: string | null;
  audioSrc?: string | null;
  correctOrder?: number | null;
  pairId?: number | null;
  isBlank?: boolean;
  dragData?: string | null;
};

export function sanitizeChallengeOptionWrite(
  body: unknown,
  mode: "create" | "update",
): Result<ChallengeOptionWrite> {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;
  const out: ChallengeOptionWrite = {
    challengeId: int(b.challengeId),
    text: str(b.text),
    correct: bool(b.correct),
    imageSrc: strOrNull(b.imageSrc),
    audioSrc: strOrNull(b.audioSrc),
    correctOrder: intOrNull(b.correctOrder),
    pairId: intOrNull(b.pairId),
    isBlank: bool(b.isBlank),
    dragData: strOrNull(b.dragData),
  };
  if (mode === "create") {
    if (out.challengeId === undefined || !out.text) {
      return { ok: false, error: "challengeId and text are required" };
    }
  }
  return { ok: true, values: out };
}
