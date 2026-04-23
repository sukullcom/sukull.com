# Observability & Structured Logging

**Who this is for:** engineers adding logs, debugging production issues, or
wiring new routes/actions into our observability stack.

**TL;DR**
- Server: `import { logger, getRequestLogger } from '@/lib/logger'`
- Client: `import { clientLogger } from '@/lib/client-logger'`
- Never use `console.*` in application code (see [Exceptions](#exceptions))
- `logger.error(...)` is automatically persisted to the `error_log` table
- Every request gets a correlation id (`x-request-id`) injected by middleware

---

## Architecture

```
                 ┌────────────────────────────┐
 Request ──────▶ │  middleware.ts             │
                 │  • mint / reuse x-request-id│
                 │  • forward on NextRequest   │
                 │  • echo on NextResponse     │
                 └────────────────────────────┘
                               │
      ┌────────────────────────┼────────────────────────┐
      ▼                        ▼                        ▼
 Server Component        API Route / Action        Client bundle
      │                        │                        │
      │  getRequestLogger()    │  getRequestLogger()    │  clientLogger
      ▼                        ▼                        ▼
  logger.* → stdout (pretty in dev, JSON in prod)
  logger.error → error_log table (async, never throws)
  clientLogger.error → console + POST /api/errors → error_log
```

**Request correlation.** `middleware.ts` mints a UUID per request (or reuses
the upstream `x-request-id` if a trusted proxy supplied one) and forwards it
on the downstream `NextRequest`. Server code can read it via
`getRequestLogger()`, which calls `next/headers` under the hood. The same id
is echoed on the response, so clients can quote it in bug reports.

**User correlation.** We deliberately do **not** forward `x-user-id` on the
request. The Supabase SSR client mutates cookies on the response object; if
we rebuild `NextResponse.next(...)` to inject headers after Supabase runs,
those cookie writes are dropped. Instead:
- server code that already has the user in scope calls
  `getRequestLogger({ userId: user.id })`
- the outgoing response carries `x-user-id` (for client-side bug-reporting
  correlation only, not for auth)

---

## Server-side logger (`lib/logger.ts`)

### Module-scoped

Use when a module has its own stable identity (queries, background jobs,
stateless utilities). No request context needed.

```ts
import { logger } from '@/lib/logger';

const log = logger.child({ labels: { module: 'db/queries/teacher' } });

export async function getAvailability(teacherId: string) {
  try {
    // …
  } catch (error) {
    log.error({
      message: 'getAvailability failed',
      error,
      source: 'server-action',
      location: 'db/queries/teacher/getAvailability',
      fields: { teacherId },
    });
    return [];
  }
}
```

### Request-scoped

Use in API routes and server actions where you want the log line (and any
persisted `error_log` row) correlated with the inbound request.

```ts
import { getRequestLogger } from '@/lib/logger';

export async function POST(req: Request) {
  const log = await getRequestLogger({ labels: { route: 'private-lesson/book' } });

  try {
    // …
    log.info('booking created', { lessonId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error({
      message: 'booking failed',
      error,
      source: 'api-route',
      location: 'api/private-lesson/book-lesson',
    });
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
```

### Levels

| Level | Use for                                                          | Persisted |
| ----- | ---------------------------------------------------------------- | --------- |
| debug | Verbose trace; skipped in production by default                  | no        |
| info  | Normal lifecycle events (“booking created”, “cache warmed”)      | no        |
| warn  | Recoverable anomalies (rate-limit hit, degraded cache, retries)  | no        |
| error | Exceptions, failed invariants, anything on-call should see later | **yes**   |

`LOG_LEVEL` env var overrides the default minimum. In `production` the default
is `info`; in `development` it's `debug`.

### Output format

- **Development:** human-readable, colorised by level.
- **Production / preview:** single-line JSON per log; plays nicely with Vercel
  log drains, Logtail, Grafana Loki, etc. No extra shipping layer required.

---

## Client-side logger (`lib/client-logger.ts`)

Minimal by design — we do not want to ship Pino or Winston to the browser.

```ts
import { clientLogger } from '@/lib/client-logger';

try {
  // …
} catch (error) {
  clientLogger.error({
    message: 'upload failed',
    error,
    location: 'components/course-image-upload',
    fields: { size: file.size },
  });
}
```

- `debug` / `info` run **only in development** (dead-code-eliminated in prod
  builds if you use them in `if (IS_DEV)` blocks; otherwise they're silent
  no-ops).
- `warn` always logs to the console.
- `error` logs to the console **and** POSTs to `/api/errors`, which persists
  to `error_log` via `lib/error-logger.ts`.

The client logger is also safe to import from isomorphic files (e.g.
`utils/cache.ts`, `utils/supabase/optimized-queries.ts`). The underlying
`reportClientError` short-circuits on the server (`typeof window ===
'undefined'`), so the error won't be double-persisted — the server-side caller
is expected to wrap its own `logger.error(...)` if the call ran there.

---

## Persistence model

| Writer                              | Target table   | Retention              |
| ----------------------------------- | -------------- | ---------------------- |
| `logger.error`                      | `error_log`    | see `db/migrations`    |
| `clientLogger.error` (browser only) | `error_log`    | same                   |
| `logAdminAction`                    | `admin_audit`  | kept indefinitely      |
| `logActivity`                       | `activity_log` | trimmed nightly (cron) |

`error_log` rows carry `requestId`, `userId` (if bound), `source`,
`location`, the serialised error, and arbitrary `metadata`. Query by
`requestId` to walk the full chain of events for a single user-reported
issue.

---

## Conventions

1. **`source`** (enum on `error_log`):
   - `server-action` — anything under `actions/**` or a `"use server"` function
   - `api-route` — anything under `app/api/**`
   - `middleware` — the Edge middleware pipeline
   - `client` — reported by `clientLogger.error`
   - `cron` — scheduled jobs
   - `background` — non-request-scoped workers
2. **`location`** — dotted/slashed path to the call site, e.g.
   `actions/user-progress/updateTotalPointsForSchools`. Keep it stable: we
   group by this when triaging.
3. **`fields`** — safe, low-cardinality metadata. Never log secrets, full
   request bodies, JWTs, password hashes, or anything a user didn't consent to
   send.
4. **Messages** are human-readable, present-tense, *not* the error itself:
   - ✅ `"booking failed"` with `error` attached
   - ❌ `"Error: Cannot read property x of undefined"`
5. **No double-logging.** If you `log.error(...)` and rethrow, the outer layer
   should catch and just `return` — don't log the same error again upstream.

---

## Exceptions (allowed `console.*`)

The only places `console.*` is still acceptable:

- `lib/logger.ts` itself (it *is* the sink).
- `lib/client-logger.ts` (same reason).
- `lib/error-logger.ts` — fallback when writing to `error_log` itself fails;
  we must not throw from the error path.
- `db/drizzle.ts` — would create a circular dependency if it imported the
  logger (the logger's error-persistence layer depends on the db client).

Everywhere else, a lint rule should eventually enforce this. For now, treat
any new `console.*` in a PR as a review blocker.

---

## Correlating a user bug report

1. User submits a bug report quoting `x-request-id: 9f3…` (we echo it on every
   response; surface it in the UI's error toast).
2. Query:
   ```sql
   SELECT created_at, source, location, message, metadata
   FROM error_log
   WHERE request_id = '9f3…'
   ORDER BY created_at;
   ```
3. Cross-reference with Vercel / Logtail logs filtered by the same id — you
   now have every structured log line from middleware to response.

---

## Adding a new module

Checklist:

- [ ] `import { logger } from '@/lib/logger'` (or `getRequestLogger` for API
      routes / server actions that need request context)
- [ ] Module-scoped helper: `const log = logger.child({ labels: { module: 'your/module' } })`
- [ ] Wrap every `throw` boundary with a `log.error({...})` call carrying
      `source`, `location`, and the original `error`
- [ ] Do *not* log at the call-site *and* the caller for the same error
- [ ] For anything on the hot path (request handlers, cron jobs), prefer
      `log.info` at success and `log.error` at failure — avoid `log.debug`
      unless it's genuinely useful during local dev
