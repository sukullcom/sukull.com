/**
 * Code-editor snippet queries.
 *
 * Keep this module self-contained -- snippets are a small, isolated domain
 * with no cross-table joins.
 */
import { cache } from "react";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import db from "@/db/drizzle";
import { snippets } from "@/db/schema";

export const createSnippet = async (data: {
  userId: string;
  userName: string;
  code: string;
  title: string;
  description: string;
  language: string;
}) => {
  await db.insert(snippets).values(data);
};

/**
 * Returns the number of snippets owned by `userId`, used to enforce the
 * 3-snippet sharing cap.
 */
export const getUserSnippetCount = cache(async (userId: string) => {
  if (!userId?.trim()) return 0;

  const [result] = await db
    .select({
      count: count(snippets.id),
    })
    .from(snippets)
    .where(eq(snippets.userId, userId.trim()));

  return result?.count ?? 0;
});

/**
 * ## Ownership model: intentionally PUBLIC
 *
 * The Sukull Code Editor is a "shared snippets library": every saved
 * snippet is visible to every signed-in user. `getAllSnippets` already
 * returns the full catalogue (paginated + searchable) so gating
 * `getSnippetById` by `userId` would only stop id-enumeration of data
 * that is already listable by any authenticated user — not a real
 * confidentiality boundary.
 *
 * **If the product ever introduces "private snippets" (link-only,
 * friends-only, or owner-only), this function MUST be updated to
 * accept the viewer's `userId` and filter with `and(eq(snippets.id,
 * id), or(eq(snippets.userId, viewerId), eq(snippets.isPublic, true)))`
 * — otherwise it becomes a real IDOR.**
 *
 * For that to be enforceable at query level, `snippets.isPublic` must
 * be added to `db/schema.ts` first. Until then, the call sites
 * (`/api/snippets/[id]` and the editor UI) document the public-pool
 * stance in their own comments.
 */
export const getSnippetById = cache(async (id: number) => {
  if (!id || id <= 0) return null;

  const [snippet] = await db
    .select()
    .from(snippets)
    .where(eq(snippets.id, id))
    .limit(1);

  return snippet || null;
});

/**
 * Paginated snippet list with optional text search + language filter.
 * `limit` is clamped to 50 to avoid accidental table dumps.
 */
export const getAllSnippets = cache(
  async ({
    search,
    language,
    limit = 20,
    offset = 0,
  }: {
    search?: string;
    language?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const conditions = [];

    if (search && search.trim()) {
      const searchTerm = search.trim();
      conditions.push(
        or(
          ilike(snippets.language, `%${searchTerm}%`),
          ilike(snippets.title, `%${searchTerm}%`),
          ilike(snippets.userName, `%${searchTerm}%`),
        ),
      );
    }

    if (language && language.trim()) {
      conditions.push(eq(snippets.language, language.trim()));
    }

    let query = db.select().from(snippets);

    if (conditions.length > 0) {
      // Drizzle's query-builder type refines after `.where(...)`, so a
      // cast back to the original `query` type is required to keep the
      // assignment valid without losing the typed shape downstream.
      query = query.where(and(...conditions)) as typeof query;
    }

    return query
      .orderBy(desc(snippets.createdAt))
      .limit(Math.min(limit, 50))
      .offset(Math.max(offset, 0));
  },
);
