# Sukull — Web

Production-ready Next.js 14 learning platform for Turkish high-school
students. Live at [sukull.com](https://sukull.com).

> The Flutter mobile client is a separate codebase (one level up in
> the workspace). Nothing in this repo is wired to mobile releases;
> the two clients share only the Supabase backend.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the values listed in docs/RUNBOOK.md §6
npm run dev:full             # Next.js (3000) + payment-server (3001)
```

- Node ≥ 18.0.0
- A Supabase project (free tier is enough for dev)
- Iyzico **sandbox** credentials for payment flows

See `docs/RUNBOOK.md` §6 for a minimal `.env.local` template.

## Scripts

| Command               | Purpose                                                    |
|-----------------------|------------------------------------------------------------|
| `npm run dev`         | Next.js dev server                                         |
| `npm run dev:full`    | Next.js + payment-server concurrently                      |
| `npm run payment-server` | Express payment-server only (`localhost:3001`)          |
| `npm run typecheck`   | `tsc --noEmit` (runs in CI before `build`)                 |
| `npm run lint`        | `next lint` (runs in CI before `build`)                    |
| `npm run build`       | Production build; `prebuild` enforces typecheck + lint     |
| `npm run analyze`     | Build with `@next/bundle-analyzer` enabled                 |
| `npm run test`        | Vitest unit tests                                          |

E2E smoke tests live in `e2e/` and are opt-in — see `e2e/README.md`.

## Architecture at a glance

- **Next.js 14 (App Router)** deployed to Vercel. Server components
  + server actions handle most data access; client components are
  kept narrow to keep First-Load JS small.
- **payment-server/** is an isolated Node/Express service deployed to
  Railway. It wraps the Iyzico SDK (which doesn't survive Vercel
  serverless cleanly) and exposes `/api/payment/initialize` +
  `/api/payment/finalize` over HTTPS with a CORS allow-list.
- **Supabase** backs both services: Postgres (via Drizzle using the
  transaction pooler) + Auth.

## Documentation

Everything operational lives in `docs/`. The canonical entry point
is the runbook; follow links from there for deeper topics.

| Path                                       | What's in it                                                         |
|--------------------------------------------|----------------------------------------------------------------------|
| `docs/RUNBOOK.md`                          | **Start here** — deploy, env vars, secret rotation, cron, incident response |
| `docs/MONITORING.md`                       | Uptime probes, Slack alerts, `error_log` dashboards                  |
| `docs/OBSERVABILITY.md`                    | Logger contract, `x-request-id` propagation                          |
| `docs/DB_OPERATIONS.md`                    | Migrations, pool sizing, slow-query playbook                         |
| `docs/SECURITY_REVIEW_CHECKLIST.md`        | Quarterly audit checklist for the service-role data path             |
| `docs/PAYMENTS.md`                         | Credit system design + Iyzico payment flow                           |
| `docs/STREAKS.md`                          | Daily streak (istikrar) engine                                       |
| `docs/SECURE_LOGOUT.md`                    | Sign-out + session revocation flow                                   |
| `docs/EMAIL_VERIFICATION_SETUP.md`         | Supabase email verification configuration                            |
| `docs/SCHOOL_SYSTEM_SETUP.md`              | Schools catalog + per-school leaderboard                             |
| `docs/LATEX_MATH_SUPPORT.md`               | KaTeX rendering in lesson content                                    |
| `docs/TURKEY_TIMEZONE_UTC+3_IMPLEMENTATION.md` | How server-side day boundaries stay locked to Turkey time        |

## Contributing

- PRs must pass `npm run typecheck` and `npm run lint`. CI runs both
  as `prebuild`, so a red build = no ship.
- Database migrations go in `supabase/migrations/` and are applied
  per `docs/RUNBOOK.md` §3.3.
- For anything touching payments, session handling, admin tooling,
  or cron — tag the PR with a reviewer from the on-call rotation.
