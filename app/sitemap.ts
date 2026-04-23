import type { MetadataRoute } from "next";
import db from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isCodeEditorEnabled, isLabEnabled } from "@/lib/feature-flags";
import { logger } from "@/lib/logger";

const log = logger.child({ labels: { module: "sitemap" } });

const BASE_URL = "https://sukull.com";

// ISR: regenerate the sitemap every 6 hours. This keeps teacher/course URLs
// fresh without re-running the DB queries on every crawl.
export const revalidate = 21600;

type Entry = MetadataRoute.Sitemap[number];

function buildStaticEntries(): Entry[] {
  const entries: Entry[] = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/learn`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/courses`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/leaderboard`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/quests`, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE_URL}/shop`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/games`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/private-lesson`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/private-lesson/teachers`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/private-lesson/get`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/private-lesson/give`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/create-account`, changeFrequency: "monthly", priority: 0.3 },
  ];

  if (isLabEnabled()) {
    entries.push({ url: `${BASE_URL}/lab`, changeFrequency: "weekly", priority: 0.4 });
  }

  if (isCodeEditorEnabled()) {
    entries.push(
      { url: `${BASE_URL}/sukull-code-editor`, changeFrequency: "weekly", priority: 0.5 },
      { url: `${BASE_URL}/sukull-code-editor/snippets`, changeFrequency: "daily", priority: 0.5 },
    );
  }

  return entries;
}

/**
 * Swallow DB errors so a transient outage never takes the whole sitemap down
 * (crawlers will happily consume the static section).
 */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    log.error({ message: "sitemap DB query failed", error: err, location: "sitemap/safe" });
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Only teacher profile pages have a per-id public route at the moment
  // (`/private-lesson/teachers/[id]`). Courses and individual snippets don't
  // have dedicated dynamic routes yet — do not list them in the sitemap.
  const teacherRows = await safe(
    () =>
      db
        .select({ id: users.id, updatedAt: users.updated_at })
        .from(users)
        .where(eq(users.role, "teacher"))
        .limit(2000),
    [] as Array<{ id: string; updatedAt: Date | null }>,
  );

  const dynamicEntries: Entry[] = teacherRows.map<Entry>((t) => ({
    url: `${BASE_URL}/private-lesson/teachers/${t.id}`,
    lastModified: t.updatedAt ?? now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    ...buildStaticEntries().map((e) => ({ ...e, lastModified: e.lastModified ?? now })),
    ...dynamicEntries,
  ];
}
