# Sukull Web — Production Runbook

Single source of truth for operating the **web stack** (Next.js on
Vercel + payment-server on Railway + Supabase Postgres/Auth). The
Flutter mobile client lives in a separate repo and has its own notes —
nothing in this file applies to that build.

Keep this file up to date in the same PR as any change to deploy
config, env vars, cron schedule, or incident response.

> Related docs:
> - `docs/MONITORING.md` — uptime probes, Slack alerts, error_log dashboards
> - `docs/OBSERVABILITY.md` — logger contract, x-request-id propagation
> - `docs/DB_OPERATIONS.md` — migrations, pool sizing, slow-query playbook
> - `docs/SECURITY_REVIEW_CHECKLIST.md` — quarterly audit
> - `docs/PAYMENTS.md` — credit system + Iyzico payment flow
> - `docs/STREAKS.md` — daily streak (istikrar) logic

---

## 1. Topology

```
┌─────────────────┐  HTTPS       ┌────────────────────┐
│ Vercel          │ ───────────► │ Railway            │
│ Next.js app     │              │ payment-server     │
│ sukull.com      │              │ (Node + Iyzico SDK)│
└─────────────────┘              └────────────────────┘
          │                                │
          ▼                                ▼
    ┌─────────────┐              ┌────────────────┐
    │ Supabase    │              │   Iyzico API   │
    │ Postgres +  │              └────────────────┘
    │ Auth        │
    └─────────────┘
```

- **Next.js** — user-facing app, server actions, API routes, cron
  endpoints. Runs on Vercel (node runtime for DB routes; edge only
  where explicitly allowed).
- **payment-server** — isolated Express service. We broke it out
  because the Iyzico SDK is not reliably safe to run inside Vercel
  serverless functions (long-lived connections, cold start cost).
- **Supabase** — Postgres (primary store) + Auth (user identity).
  The Drizzle-backed code in this repo uses the *transaction pooler*
  (`:6543`) at runtime and the *session pooler* (`:5432`) only for
  `drizzle-kit` migrations.

## 2. Environments & secrets

### 2.1 Vercel (Next.js) — required env vars

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # server-only; never NEXT_PUBLIC_*

# Database (transaction pooler — port 6543)
DATABASE_URL=postgres://...pooler.supabase.com:6543/postgres

# Payment server (Railway URL)
NEXT_PUBLIC_PAYMENT_SERVER_URL=https://<project>.up.railway.app

# Admin access
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# Cron
CRON_SECRET=<long-random-string>

# Internal analytics sink — gates middleware → /api/activity-log writes.
# If unset in production, page-view analytics (DAU/WAU/MAU, school
# leaderboard activity weighting) silently stop; the middleware logs a
# single boot warning. See §2.4 for rotation.
INTERNAL_API_KEY=<long-random-string>

# App identity
NEXT_PUBLIC_APP_URL=https://sukull.com
NODE_ENV=production
```

### 2.2 Railway (payment-server) — required env vars

```bash
NODE_ENV=production
PORT=3001

# Same database as the web app (transaction pooler)
DATABASE_URL=postgres://...pooler.supabase.com:6543/postgres

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
IYZICO_BASE_URL=https://api.iyzipay.com

# CORS allow-list
NEXT_PUBLIC_APP_URL=https://sukull.com

# Managed-DB root CA (recommended). When set, the Postgres pool runs
# with full chain verification (rejectUnauthorized: true). When
# omitted, traffic is still encrypted but the server cert is not
# verified — the server logs a WARN on boot.
CA_CERT=<PEM-encoded root certificate>
```

### 2.3 Secret rotation policy

| Secret                          | Rotation cadence | Where to rotate                              | Who's paged on compromise |
|--------------------------------|------------------|----------------------------------------------|---------------------------|
| `SUPABASE_SERVICE_ROLE_KEY`    | 90 days / on leak | Supabase → Project settings → API           | on-call + CTO             |
| `CRON_SECRET`                  | 180 days          | Vercel env + any external cron service       | on-call                   |
| `IYZICO_API_KEY/SECRET_KEY`    | on leak only      | Iyzico merchant panel                        | on-call + CTO             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| when keypair rotated | Supabase → API                           | on-call                   |
| `INTERNAL_API_KEY`             | 180 days / on leak | Vercel env (server-only; never NEXT_PUBLIC_*) | on-call               |

Rotation sequence (any key):

1. Generate the new value in the source of truth (Supabase, Iyzico).
2. Set the new value in **both** Vercel and Railway (same key name).
3. Trigger a redeploy of each platform so the process picks it up.
4. Revoke / delete the old value at the source.
5. Smoke-test: login, `/api/health`, `/health` on Railway, test purchase.

Compromise runbook:

1. Revoke the key immediately at the source (Supabase dashboard,
   Iyzico panel). Don't wait for the redeploy — revoke first.
2. Rotate per the steps above.
3. Open an incident ticket; capture:
   - suspected leak vector (git diff, Vercel build log, screenshot);
   - timeline (first bad request in `error_log`);
   - blast radius (what the key could do in that window).
4. If the key is `SUPABASE_SERVICE_ROLE_KEY`, additionally audit
   `admin_audit` and `error_log` for the compromise window — any
   admin-shaped writes by unexpected principals get ticketed.

Never commit `.env*` files. The repo's `.gitignore` already excludes
them; if one slips into git history, rotate the affected secrets
**before** rewriting history.

## 3. Deploy

### 3.1 Next.js (Vercel)

- Production deploys are triggered by pushes to `main`.
- `prebuild` runs `npm run typecheck && npm run lint`. If either
  fails, Vercel fails the build — that is **desired**; never disable
  it to unblock a ship.
- Preview deploys run for every PR; smoke-test critical routes
  (`/`, `/learn`, `/lesson/…`, `/credits`, `/admin`) before merging.

### 3.2 payment-server (Railway)

- Auto-deploys from the same GitHub repo. `railway.json` scopes the
  build/start commands to `payment-server/`:
  - build: `cd payment-server && npm ci --omit=dev`
  - start: `cd payment-server && node server.js`
- Post-deploy health check:

  ```bash
  curl -fsS https://<project>.up.railway.app/health | jq .
  # expect: {"success":true,"services":{"supabase":true,"database":true,"iyzico":true}}
  ```

### 3.3 Supabase migrations

Migrations live in `supabase/migrations/*.sql` and are applied via
`drizzle-kit` from a developer machine with `DIRECT_URL` set to the
session pooler (`:5432`):

```bash
npx drizzle-kit push
```

For PR-gated migrations, always:

1. Apply on a staging Supabase first.
2. Verify with `select count(*)` on any touched table.
3. Apply on production during a low-traffic window (Turkey time 02:00–05:00).
4. Note the migration filename + timestamp in the PR description.

## 4. Cron

Cron endpoints are implemented as API routes and guarded by the
`CRON_SECRET` bearer token (or Vercel's internal cron header when
invoked by Vercel itself).

| Path                         | Schedule (UTC)    | What it does                                           |
|------------------------------|-------------------|--------------------------------------------------------|
| `/api/cron/daily`            | `0 21 * * *`      | Rolls `previous_total_points`, resets missed streaks   |
| `/api/cron/reset-streaks`    | (subsumed by daily) | Stand-alone streak reset; kept for manual use         |

`0 21 * * *` UTC == `00:00 Turkey Time (UTC+3)` — that alignment is
deliberate; the streak engine treats local midnight as the day
boundary. Don't move the schedule without also updating
`getTurkeyTodayString()` usages (see `docs/STREAKS.md`).

### Manual trigger (ops)

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://sukull.com/api/cron/daily
```

### Cron failure triage

1. Check Vercel → Deployments → Functions → the cron route for the
   last invocation. A 5xx there is our first clue.
2. Query `error_log` for `location = 'cron/daily'` within the last
   24 h, grouped by `message`.
3. If the failure was a DB timeout, run the manual trigger *after*
   the DB is healthy. The endpoint is idempotent — re-running the
   same day is a no-op (see `ON CONFLICT DO NOTHING` inserts in
   `db/queries/streak.ts`).
4. If the failure was "partial" (some users rolled, others not),
   the endpoint retries from the last cursor on next run. Don't
   hand-edit `user_progress.previous_total_points` unless you're
   confident — wrong values silently corrupt tomorrow's streak
   calculations.

## 5. Incident response

### 5.1 Severity matrix

| Severity | Definition                                                                       | Response time |
|---------|-----------------------------------------------------------------------------------|---------------|
| SEV-1    | Payments broken, full site 5xx, data leak suspected                             | < 15 min       |
| SEV-2    | One segment down (e.g. `/learn` red), cron failed > 1 day, login degraded        | < 1 hr         |
| SEV-3    | Single feature broken (e.g. leaderboard stale), elevated error rate              | < 1 business day |
| SEV-4    | Cosmetic / non-blocking                                                          | next sprint    |

### 5.2 First-5-minutes checklist

1. Acknowledge the page. Open `#sukull-alerts` and post a single
   holding message: *"Investigating <symptom>. Next update in 10 min."*
2. `curl -fsS https://sukull.com/api/health | jq .` — is Next.js up?
3. `curl -fsS https://<railway>.up.railway.app/health | jq .` — is
   payment-server up?
4. Supabase dashboard → **Database** → **Load** — connection
   saturation? Active queries? If CPU > 80% for > 5 min, page CTO.
5. Vercel → **Deployments** — did we ship in the last 30 min? If
   yes, be ready to rollback (§5.3).
6. `error_log` anomaly scan:

   ```sql
   SELECT location, COUNT(*)
   FROM error_log
   WHERE created_at > now() - interval '30 minutes'
   GROUP BY location
   ORDER BY count DESC;
   ```

### 5.3 Rollback

- **Vercel**: Deployments tab → last green deploy → "Promote to
  Production". This is the preferred rollback; it's instant and
  doesn't require a git revert.
- **Railway**: Deployments → previous healthy build → "Redeploy".
- **Supabase schema**: never rolled back automatically. If a
  migration is the root cause, write a *forward* migration that
  re-adds the dropped column / relaxes the constraint, and ship it
  through the same path (§3.3). Hand-editing schema without a
  migration is grounds for an incident of its own.

### 5.4 Comms

- Internal: post updates in `#sukull-alerts` every 10 min until
  resolved. Include `x-request-id` of the worst-case trace.
- External: for SEV-1/2 lasting > 30 min, post on the status page
  (if live) and notify power users (teachers with live lessons) via
  the admin broadcast tool.
- Post-mortem: SEV-1 and SEV-2 always get a written post-mortem
  within 3 business days, stored under `post-mortems/`.

## 6. Local development quick-start

```bash
# Both services
npm run dev:full

# Or separately
npm run dev              # Next.js → localhost:3000
npm run payment-server   # Express → localhost:3001
```

Minimal `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PAYMENT_SERVER_URL=http://localhost:3001
DATABASE_URL=postgres://...pooler.supabase.com:6543/postgres
DIRECT_URL=postgres://...pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
IYZICO_API_KEY=sandbox-...
IYZICO_SECRET_KEY=sandbox-...
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
ADMIN_EMAILS=you@example.com
CRON_SECRET=dev-only
```

## 7. Dependency hygiene

Run `npm audit` before every release; treat it as an ops signal, not a
CI gate (too noisy).

### 7.1 Policy

| Severity    | Action                                                  |
| ----------- | ------------------------------------------------------- |
| critical    | Patch or upgrade within **24h**                         |
| high        | Patch within **1 week**, or document an explicit waiver |
| moderate    | Patch within the next monthly sprint                    |
| low / info  | Rolling — address opportunistically                     |

Prefer `npm audit fix` (no `--force`) first: it only touches transitive
packages and rarely breaks builds. `--force` upgrades direct deps to
semver-major and must be done in a dedicated PR with typecheck + test
+ local smoke run.

### 7.2 Direct deps with intentional pins

These are **not** automatically bumped even when audit flags them —
because the upgrade is semver-major and requires deliberate verification:

| Package              | Current | Pinned because                                                                           |
| -------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `next`               | 14.2.x  | App Router + RSC surface stable here; Next 15/16 bring a React 19 peer + caching rewrite |
| `eslint-config-next` | 14.2.12 | Must match `next` major                                                                  |
| `drizzle-kit`        | 0.30.x  | 0.31.x changes the migration file format; plan in a standalone PR                        |

When upgrading any of the above, run:

```bash
npm run typecheck
npm test -- --run
npm run build
# plus manual smoke against preview (login, lesson, credit purchase, admin)
```

### 7.3 Quarterly audit

Open a `deps/quarterly-YYYY-QN` branch, run `npm audit` + `npm outdated`,
and land the patches as a single PR with a changelog summarising each
jump. Reference this runbook section in the PR body so reviewers know
the policy the change follows.

---

## 8. Post-deploy sanity (human, ~3 min)

After every production deploy, verify:

- [ ] `https://sukull.com/` loads, no console errors.
- [ ] `https://sukull.com/api/health` returns 200.
- [ ] Railway `/health` returns 200.
- [ ] Login → `/learn` → open a lesson → answer one challenge → `/learn`
      shows updated points.
- [ ] `/credits` loads package list (auth'd).
- [ ] `/admin` loads (as admin) and `/admin/errors` is empty or
      familiar-looking.
- [ ] Vercel → Functions → no cold-start timeouts in the last 5 min.
- [ ] Vercel → Functions → first cold start log does **not** contain
      `INTERNAL_API_KEY is not set in production` — if it does,
      analytics are silently disabled; set the env var and redeploy
      before closing the ticket.

If any of these fail, consider rolling back (§5.3) before opening
a ticket.
