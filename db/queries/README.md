# `db/queries/` — domain-split query modules

All Drizzle queries live in one of the domain files below. The legacy
`db/queries.ts` at the repo root is now a **re-export facade** for
backwards compatibility; it contains no query logic.

```
db/queries/
  shared.ts        # cross-domain helpers (week boundaries, heart constants)
  user.ts          # getUserProgress, credits, subscriptions
  learn.ts         # courses, units, lessons, course/lesson progress
  leaderboard.ts   # getTopUsers, school points, user rank
  schools.ts       # getSchools master-data listing
  applications.ts  # teacher + student onboarding, role checks, teacher fields
  teacher.ts       # availability, profile, ratings, stats, income
  private-lesson.ts# booking flow, review submission
  snippets.ts      # code editor snippets
```

## Dependency graph (acyclic, leaf → root)

```
shared                  <- no deps
user                    <- no cross-domain deps
schools                 <- no cross-domain deps
leaderboard             <- no cross-domain deps
snippets                <- no cross-domain deps
applications            <- no cross-domain deps
learn                   <- user
teacher                 <- shared
private-lesson          <- applications
```

No file imports from `../queries.ts` (the facade). The facade only
imports from this folder.

## Where to add new queries

1. Pick the right domain file (see table above). If the query doesn't
   fit, prefer creating a new file over stuffing into an unrelated one.
2. Keep file-local helpers (e.g. row mappers, normalizers) private —
   don't `export` anything that isn't meant for reuse.
3. Add a matching `export` line in `db/queries.ts` so existing callers
   that import from `@/db/queries` keep working.

## Importing

New code SHOULD import from the specific domain:

```ts
import { getUserProgress } from "@/db/queries/user";
import { bookLesson } from "@/db/queries/private-lesson";
```

Legacy code uses the facade:

```ts
import { getUserProgress, bookLesson } from "@/db/queries";
```

Both work. The facade path is kept alive indefinitely; migrating
imports is nice-to-have but not urgent. A mechanical rewrite via
`jscodeshift` is the recommended follow-up if we ever want to delete
the facade.

## Caching conventions

- Use React's `cache()` for request-scoped memoization of hot read paths.
- Use `unstable_cache` (from `next/cache`) for cross-request caching of
  expensive queries. Pair every `unstable_cache` call with:
  - A tag from `lib/cache-tags.ts` so invalidation is type-safe.
  - A TTL from `CACHE_TTL`.
  - Corresponding `revalidateTag()` calls at every mutation point.
- Prefer building `unstable_cache` wrappers at module scope when the
  tags and key are static (see `_getCoursesCached`, `_getTopUsersCached`).
- For dynamic per-X tags (e.g. per-teacher stats where the tag must
  include `teacherId`), inlining `unstable_cache(...)` inside the
  exported function is acceptable; Next.js uses the key array to
  dedupe across wrapper instances, so the cache stays effective. See
  `getTeacherStats` for the pattern.
