# Quarterly Security Review Checklist

**Who this is for:** the engineer on rotation for the quarterly
security review. The goal is a systematic audit of the surfaces most
likely to leak data or accept forged writes, in a fixed ~2-hour pass.

**Why this exists:** Our server-side data access goes through Drizzle
against Postgres using the service-role credentials. That path
bypasses Supabase's PostgREST + RLS — it's a deliberate choice (we
need transactions, multi-table joins, and row-level cascades that
PostgREST can't express), but it means **every new query is one
forgotten `where userId = ?` away from a data leak**. Unlike RLS, the
compiler and the framework will not catch that mistake; only code
review + this checklist will.

**PostgREST / browser (`NEXT_PUBLIC_SUPABASE_ANON_KEY`):** Row Level
Security applies. Hand-written migration
`supabase/migrations/0038_rls_study_buddy_schools_users.sql` enables RLS
on `study_buddy_chats`, `study_buddy_messages`, `study_buddy_posts`,
`schools` (public read), and `users` (self row only for authenticated
SELECT/INSERT/UPDATE), plus RPCs `fetch_peer_profiles_for_study_buddy`
and `auth_lookup_provider_by_email`. Apply with `npm run db:apply --
supabase/migrations/0038_rls_study_buddy_schools_users.sql` before
shipping client changes that rely on them. Server-side Drizzle (owner
connection) still bypasses RLS by design.

---

## Cadence

- **Quarterly full pass** (every 3 months) — the checklist below,
  plus a dependency audit (`npm audit`) and an `error_log` anomaly
  scan for the prior quarter.
- **On every PR that touches `db/queries/**`** — reviewer runs through
  §1 (Query-level filters) for the diff only.
- **Ad-hoc** when adding a new table or a new user role.

---

## 1. Query-level filters

For every `db.query.*` / `db.select().from(…)` call that returns
user-owned rows, verify:

- [ ] A `where(eq(table.userId, ctx.userId))` (or equivalent
      participant check for shared tables like `study_buddy_chats`)
      is present.
- [ ] The `ctx.userId` comes from `getServerUser()` or the validated
      arg of a server action — **never** from request body / query
      params.
- [ ] For admin-only queries, `await isAdmin()` is called on the
      same request path before the query runs.
- [ ] For teacher-only queries, the teacher role check from
      `db/queries/user.ts` (`isTeacher`) runs first.

Quick search to start with:

```bash
# Find query files that never reference a userId filter.
rg -L 'userId' db/queries/
```

Any match is worth eyeballing — a legitimate exception (e.g. the
leaderboard, which is intentionally public-aggregated) should have a
comment saying so. Anything unannotated is a review blocker.

**Documented public-pool exceptions** (do NOT flag):

- `getSnippetById` / `getAllSnippets` in `db/queries/snippets.ts` —
  snippets are a shared library by product design. If the product
  team adds "private snippets", the filter in both `queries/snippets.ts`
  and `app/api/snippets/[id]/route.ts` MUST be updated in the same PR;
  the docblock on `getSnippetById` spells out the migration shape.
- `schools` leaderboard / catalogue endpoints — aggregated totals
  only, no PII exposed.
- Public `challenges` and `lessons` GETs under `/api/lessons?action=*` —
  content tables, no per-user fields.

## 2. Route-level authorization

Walk every file under `app/api/**/route.ts`:

- [ ] Does each HTTP method have either `secureApi.*`, a manual
      `getServerUser()` call, or an explicit `admin` / `cron` /
      `internal` guard?
- [ ] For dynamic routes (`[id]`, `[chatId]`), is the id revalidated
      against the caller's identity **before** reading sensitive
      fields?
- [ ] Is rate-limit coverage aligned with `docs/MONITORING.md`
      (production guide) — no public route doing an uncached join
      without a bucket?

`rg 'export async function (GET|POST|PUT|PATCH|DELETE)' app/api` is a
fast way to enumerate all handlers; then grep for `getServerUser` +
`isAdmin` coverage.

## 3. Server actions (`actions/**`)

- [ ] Each action starts with `"use server"`.
- [ ] Each mutating action opens with `const user = await getServerUser();
      if (!user) return …` before touching the DB.
- [ ] Any action that accepts ids as args re-verifies ownership in
      the same transaction (`where userId = ? and id = ?`).
- [ ] Rate limits are attached to *destructive* / *money-moving*
      actions (`checkRateLimit` with `onStoreError: "closed"`).
- [ ] Every `onStoreError: "closed"` caller maps `!rl.allowed` via
      `rateLimitClosedDenyPayload` (or equivalent `rl.storeError` branch),
      so a limiter / DB outage returns **503**, not a misleading **429**
      “çok sık deneme” to the user. The helper lives in
      `lib/rate-limit-db.ts`; current callers: `lib/api-middleware.ts`,
      `app/api/private-lesson/listings/[id]/offers/route.ts` (POST),
      `app/api/private-lesson/offers/[id]/route.ts` (PATCH),
      `app/api/private-lesson/messages/unlock/route.ts`.

## 4. Middleware & headers

- [ ] `middleware.ts` still applies the request-id + session headers.
- [ ] CSP in `next.config.js` is present and not weakened with
      `unsafe-eval` / `unsafe-inline` outside known exceptions.
- [ ] `x-frame-options`, `referrer-policy`, `permissions-policy` are
      still set.

## 5. Supabase admin client

- [ ] `utils/supabase/admin.ts` is only imported from `server-only`
      files or server actions.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never leaks into a `NEXT_PUBLIC_*`
      variable (grep for it).
- [ ] The only places calling `supabase.auth.admin.*` are the ones
      documented here: `actions/account.ts`, admin tooling, cron.

## 6. Payment integrity

- [ ] `payment-server/server.js` trusts `creditsAmount` and
      `totalPrice` only from stored request data, never from the
      client-supplied finalize request body.
- [ ] `idempotencyKey` is re-verified on every finalize call.
- [ ] `payment_logs.status` transitions are append-only
      (`pending_3ds` → `settled | failed`, never mutable once
      `settled`).
- [ ] Iyzico webhook/callback endpoints validate the signed
      `conversationData` blob, not loose query params.

## 7. PII surface

- [ ] Log lines (server-side + client-side) never contain full email,
      phone, or address. Accepted identifiers: `userId` (uuid),
      `x-request-id`.
- [ ] `error_log.metadata` is reviewed for PII drift — run:

      ```sql
      SELECT metadata FROM error_log
      WHERE created_at > now() - interval '30 days'
        AND (metadata::text ILIKE '%@%.%'  -- email-shaped
          OR metadata::text ~ '\+?90\d{10}' -- TR phone-shaped
          OR metadata::text ILIKE '%password%');
      ```

- [ ] Account-deletion anonymization still nulls `errorLog.userId`
      (see `actions/account.ts`).

## 8. Admin audit integrity

- [ ] `admin_audit` rows are never mutated or deleted by any query;
      grep for `delete.*admin_audit` / `update.*admin_audit` —
      should return no application-level hits.
- [ ] Every new admin tool calls `logAdminAction(...)` before the
      destructive step so evidence survives a mid-flight failure.

## 9. Dependency hygiene

- [ ] `npm audit --omit=dev` shows no high/critical.
- [ ] `next`, `@next/bundle-analyzer`, `@supabase/ssr`,
      `@supabase/supabase-js` are within one minor of the supported
      range.
- [ ] Nothing inside `node_modules/.cache` or generated `.next` has
      accidentally been committed.

## 10. `error_log` anomaly scan

Run once per review pass:

```sql
SELECT location, COUNT(*) AS n
FROM error_log
WHERE created_at > now() - interval '90 days'
GROUP BY location
ORDER BY n DESC
LIMIT 25;
```

Anything growing month-over-month that isn't already ticketed is a
candidate for the next sprint.

---

## Output of a review

Each review produces a short report attached to the sprint tracker:

1. Checklist result (✓ / ✗ per numbered section).
2. List of new findings (with severity + file path).
3. PRs filed to address findings.
4. Any item intentionally deferred, with a reason.

Keep reports in the `security-reviews/` folder so drift between
quarters becomes visible.
