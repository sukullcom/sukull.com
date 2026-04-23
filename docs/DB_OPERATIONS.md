# DB Operations Runbook

Short, opinionated guide to the database tooling in this repo. Read this
before touching `supabase/migrations/**` or running schema changes against
production.

## Connection strings

Two URLs live in `.env`. Know which one to use:

| Variable       | Port | Purpose                                          | DDL safe? |
| -------------- | ---- | ------------------------------------------------ | --------- |
| `DATABASE_URL` | 6543 | Supabase transaction pooler. Used at runtime.    | NO (avoid)|
| `DIRECT_URL`   | 5432 | Direct Postgres connection. For DDL / migrations.| Yes       |

The runtime (`db/drizzle.ts`) always uses `DATABASE_URL`; migration tooling
prefers `DIRECT_URL`.

## Migration styles in this repo

We have two parallel migration styles and that is intentional:

1. **Drizzle-generated** (`0000_*.sql`..`0006_*.sql`, etc.) — created by
   `npm run db:generate` from diffs to `db/schema.ts`. Tracked in
   `supabase/migrations/meta/_journal.json`.
2. **Hand-written SQL** (`0003_add_snippets_indexes.sql`,
   `0018_add_critical_indexes.sql`, `0025_*`, ...) — for things Drizzle can't
   express cleanly (trigram indexes, `CREATE EXTENSION`, deploy-time SQL
   functions). **Not** in the journal; applied manually.

Every hand-written SQL file must be **idempotent** (`IF NOT EXISTS`,
`IF EXISTS`, `CREATE OR REPLACE`). Re-running it should be a no-op.

## Commands

### Apply a hand-written migration

```bash
npm run db:apply -- supabase/migrations/0025_add_admin_search_and_leaderboard_indexes.sql
```

Reads the file, connects via `DIRECT_URL`, executes the whole file as a
single multi-statement batch. Errors surface with a non-zero exit code.

### Refresh planner statistics

```bash
npm run db:analyze
```

Runs `ANALYZE` on the busiest tables. Do this **once** after an index
migration so the planner knows about the new indexes. Harmless if run more
often.

### Check hot query plans

```bash
npm run db:explain
```

Runs `EXPLAIN ANALYZE` on representative query shapes and labels each plan
`OK` / `SMALL` / `WARN` / `INFO`. Use when:

- Confirming an index migration is actually being picked up.
- Investigating a "why is this endpoint slow" report.
- Periodically in staging against production-shaped data.

`SMALL` means the table has too few rows for an index to beat a seq scan;
that's the planner making the right call and isn't a problem.

### Drizzle ecosystem (unchanged)

```bash
npm run db:generate   # diff schema.ts -> new SQL migration
npm run db:push       # push schema.ts to DB without generating a file
npm run db:studio     # Drizzle Studio UI, localhost:4983
```

## Recommended workflow for a new index migration

1. Write `supabase/migrations/00NN_<descriptive_name>.sql`.
2. Make every statement `IF NOT EXISTS`.
3. In the header, document:
   - **Why** the index exists (which query pattern it covers).
   - **Which table size** it matters for.
   - **Deployment note** (plain `CREATE INDEX` vs `CONCURRENTLY`).
4. `npm run db:apply -- supabase/migrations/00NN_*.sql`
5. `npm run db:analyze` to refresh stats.
6. `npm run db:explain` to confirm the planner engages the new index on a
   representative query. Add a new case to `scripts/explain-hot-queries.ts`
   if the query isn't covered there yet.

## Notes on CONCURRENTLY

All index migrations so far use plain `CREATE INDEX`. This is fine because:

- `teacher_applications`, `private_lesson_applications` are small (hundreds
  of rows).
- `schools` is ~50K rows; btree index creation takes seconds.
- `lesson_bookings`, `lesson_reviews`, `user_progress` are still moderate.

If any of these cross ~500K rows, switch future index migrations to
`CREATE INDEX CONCURRENTLY` (and drop the `IF NOT EXISTS` wrapper; they're
incompatible) to avoid write locks.
