# Uptime & Error Monitoring

**Who this is for:** operators setting up alerts, on-call engineers wiring
external monitors, anyone investigating "is the site up?" style questions.

**Scope:** production monitoring of `sukull.com` and the companion
`payment-server`. Development-time debugging is covered by
[`OBSERVABILITY.md`](./OBSERVABILITY.md).

---

## TL;DR

| Need                                      | Where it lives                                  |
| ----------------------------------------- | ----------------------------------------------- |
| Is the app reachable + DB healthy?        | `GET /api/health` (Next.js)                     |
| Is the payment-server reachable?          | `GET /health` (payment-server Express app)      |
| Did a server error occur?                 | `error_log` table (populated by `logger.error`) |
| Did a client error occur?                 | `error_log` table (populated by `clientLogger`) |
| Did the bank/Iyzico 3DS callback fail?    | `error_log` with `location = 'app/api/payment/3ds/callback/route.ts'` |
| Real-time / push alerts                   | Uptime monitor webhooks (see below)             |
| Optional aggregated error dashboard       | Sentry (opt-in; see [§ Sentry](#optional-sentry)) |

---

## Readiness probes

### `/api/health` (Next.js)

Source: [`app/api/health/route.ts`](../app/api/health/route.ts).

Runs a lightweight `SELECT 1` against Postgres. Responds:

```jsonc
200 OK
{ "status": "ok", "checks": { "database": "ok" }, "timestamp": "2026-…" }
```

```jsonc
503 Service Unavailable
{ "status": "degraded", "checks": { "database": "fail" }, "timestamp": "2026-…" }
```

Headers:

- `Cache-Control: no-store`        — monitors must never see a stale 200
- `Content-Type: application/json`

**What it does NOT probe:**

- Supabase Auth availability (deliberately — Supabase has its own status
  page; probing it from here would couple our SLO to theirs).
- Payment-server health (it has its own endpoint; see below).
- CDN/edge propagation — that's the uptime monitor's job by geography.

### `/health` (payment-server)

Source: [`payment-server/server.js`](../payment-server/server.js).

Reports the boolean state of each required dependency so on-call can tell
*which* piece failed:

```jsonc
200 OK
{
  "success": true,
  "timestamp": "2026-…",
  "services": {
    "supabase": true,
    "database": true,
    "iyzico": true
  },
  "env": "production"
}
```

A `false` in any sub-service is a **critical** page — payments are down.

---

## External uptime monitoring

Any HTTPS prober works. The two we recommend:

### Better Uptime (recommended)

1. Create a new **HTTP / HTTPS Heartbeat** monitor.
2. URL: `https://sukull.com/api/health`.
3. Expected status code: `200`.
4. Check every: `3 minutes` (production), `10 minutes` (staging).
5. Regions: `Europe West`, `Europe North`, `US East`. At least two regions
   to avoid false alarms on transient regional ISP issues.
6. Alert policy:
   - First 1 failed check → no alert (may be transient).
   - 2 consecutive failures → page on-call via SMS + Slack.
   - 3 consecutive failures → page escalation contact.
7. Repeat for:
   - `https://sukull.com/` (marketing landing, should serve 200 with no
     DB dependency).
   - `https://payment.sukull.com/health` (payment-server; adjust hostname).

### UptimeRobot (cheaper/free tier)

1. Monitor type: **HTTP(s)**.
2. URL: `https://sukull.com/api/health`.
3. Monitoring interval: `5 minutes` (free plan).
4. Keyword monitoring (optional, paid): alert when body does **not** contain
   `"status":"ok"` even on 200. Defends against a compromised reverse proxy
   returning an empty 200.
5. Alert contacts: on-call email + Slack webhook.

### Slack webhook

Both tools emit to Slack via incoming-webhook URL. Create a dedicated
`#alerts-production` channel and restrict membership — noisy channels get
muted, muted channels get ignored, ignored channels cost customers.

---

## Payment-specific alerts

Because payment flows touch real money, layer a second alert set on top of
uptime monitoring:

1. **Iyzico 3DS failure burst.** Query over the last 15 min:

   ```sql
   SELECT COUNT(*) FROM error_log
   WHERE created_at > now() - interval '15 minutes'
     AND (location ILIKE '%payment/3ds%'
          OR location ILIKE '%credit-purchase%');
   ```

   Threshold: `> 10` in 15 min → page on-call. Normal baseline is single-digit.

2. **Credit settlement failures.** Query:

   ```sql
   SELECT COUNT(*) FROM payment_logs
   WHERE created_at > now() - interval '30 minutes'
     AND status = 'failed';
   ```

   Threshold: `> 20` in 30 min → Iyzico incident likely; check their status
   page and consider flipping `NEXT_PUBLIC_PAYMENT_USE_3DS` back to
   `false` if the 3DS path is the outlier.

3. **Idempotency key explosion.** Should never happen; indicates a client
   bug reissuing payment attempts in a loop:

   ```sql
   SELECT user_id, COUNT(*) FROM payment_logs
   WHERE created_at > now() - interval '1 hour'
   GROUP BY user_id HAVING COUNT(*) > 20;
   ```

Wire these as scheduled queries in your database's monitoring layer
(Supabase has scheduled functions; Postgres has `pg_cron`).

---

## Error-log dashboards

`error_log` is the source of truth for anything `logger.error(...)` or
`clientLogger.error(...)` observed.

### Quick triage query

Run this each morning (and especially during incidents):

```sql
SELECT
  source,
  location,
  COUNT(*) AS n,
  MAX(created_at) AS last_seen
FROM error_log
WHERE created_at > now() - interval '24 hours'
GROUP BY source, location
ORDER BY n DESC
LIMIT 30;
```

Spikes in an unfamiliar `location` are nearly always an incident worth
opening a ticket for.

### Per-request drill-down

Users paste an `x-request-id` from an error toast:

```sql
SELECT created_at, source, location, message, metadata
FROM error_log
WHERE request_id = '9f3…'
ORDER BY created_at;
```

(See [`OBSERVABILITY.md`](./OBSERVABILITY.md) for the correlation model.)

---

## Optional: Sentry

We currently rely on `error_log` + the uptime monitor for alerting; this is
**sufficient** for our traffic envelope and avoids an additional vendor
dependency. Sentry's value for us would be:

- Grouped stack-trace fingerprints with occurrence counts.
- Release-tagged regression detection.
- Source-map upload for minified client stack traces.

If/when we take that dependency, the integration is:

1. `pnpm add @sentry/nextjs` (wraps both server and client).
2. `npx @sentry/wizard@latest -i nextjs` generates:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`
   - Patches `next.config.js` with `withSentryConfig`.
3. Env vars required (add to `.env.production.local` and Vercel project):
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN` (for source-map upload, CI only)
4. **Do not remove** `lib/logger.ts` / `error_log`. Sentry is the external
   grouping layer; `error_log` remains the durable, self-hosted ground truth
   and is queryable with plain SQL. The two should coexist:
   - Inside `logger.ts`'s `emitError()`, after persisting to `error_log`,
     also call `Sentry.captureException(error)` when Sentry is loaded.
   - Keep the error persistence non-blocking: Sentry failures must not
     mask the DB write, and vice versa.
5. Sampling: set `tracesSampleRate: 0.05` for production (5 % of traffic is
   plenty at 10 k MAU; full sampling would burn through the free tier in a
   week).
6. PII stripping: set `sendDefaultPii: false` and strip request bodies in
   `beforeSend`. Our middleware already carries `x-request-id`; that's the
   only identifier Sentry needs to cross-reference with `error_log`.

Until Sentry is installed, **treat `error_log` + uptime webhooks as the
primary alert path**. They are good enough.

---

## Incident runbook (the short version)

When an alert fires:

1. **Acknowledge** in the alerting tool within 5 minutes.
2. Check `/api/health` manually — is the app actually down, or just
   regionally unreachable from the monitor's vantage point?
3. Query `error_log` for the last 30 minutes, grouped by `location` (see
   [§ Quick triage query](#quick-triage-query)). A spike in one location
   usually names the subsystem.
4. If payments are affected, inspect `payment_logs`:
   ```sql
   SELECT status, COUNT(*) FROM payment_logs
   WHERE created_at > now() - interval '30 minutes'
   GROUP BY status;
   ```
   A `failed` / `network_error_3ds_*` spike → suspect Iyzico; check their
   status page; consider flipping `NEXT_PUBLIC_PAYMENT_USE_3DS=false`
   temporarily.
5. **Roll forward, not back**, for code bugs — the last green deploy's
   commit should be tagged in Vercel; `vercel rollback` only as a last
   resort since it leaves DB migrations ahead of code.
6. Post-mortem expected for any alert lasting > 15 minutes.

---

## Env variable checklist (production)

| Variable                               | Used by                          | Required |
| -------------------------------------- | -------------------------------- | -------- |
| `DATABASE_URL`                         | Next.js + payment-server         | **yes**  |
| `NEXT_PUBLIC_SUPABASE_URL`             | All                              | **yes**  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Next.js (client + SSR)           | **yes**  |
| `SUPABASE_SERVICE_ROLE_KEY`            | `utils/supabase/admin.ts`        | **yes**  |
| `INTERNAL_API_KEY`                     | Middleware → `/api/activity-log` | **yes**  |
| `NEXT_PUBLIC_PAYMENT_SERVER_URL`       | `components/credit-purchase.tsx` | **yes**  |
| `NEXT_PUBLIC_PAYMENT_USE_3DS`          | 3DS flag; `"true"` in production | **yes**  |
| `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` | payment-server                   | **yes**  |
| `IYZICO_BASE_URL`                      | payment-server                   | **yes**  |
| `ADMIN_EMAILS`                         | `lib/admin.ts`                   | optional |
| `NEXT_PUBLIC_SENTRY_DSN`               | Sentry (if installed)            | optional |

Audit this list quarterly; divergence between `.env.example` and
production is the #1 cause of Friday-evening incidents.
