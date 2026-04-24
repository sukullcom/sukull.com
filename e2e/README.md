# End-to-end smoke suite

This directory holds **opt-in** Playwright smoke tests. They are not part
of `npm test` (which runs Vitest) and their dependencies are **not** in
`devDependencies` — Playwright pulls in ~200 MB of prebuilt browser
binaries we don't want to force on every contributor.

## Why separate from `tests/`

- `tests/` → Vitest, pure-Node, runs in <2 s, exercises internal contracts.
- `e2e/`   → Playwright, real browser, requires a running preview
  deployment + seeded test account, ~30 s per run.

Every E2E spec here should have a matching Vitest unit test that covers
the same boundaries in-process. The E2E only needs to prove that the
browser-visible wiring (labels, aria-roles, redirects) didn't drift.

## One-time setup

```bash
npm i -D @playwright/test
npx playwright install chromium
```

Commit neither of those install artefacts — they stay per-developer.

## Running

Against a local dev server:

```bash
BASE_URL=http://localhost:3000 \
TEST_ACCOUNT_EMAIL=e2e+deletes@example.com \
TEST_ACCOUNT_PASSWORD='…' \
TEST_ACCOUNT_USERNAME='e2e_deletable' \
npx playwright test
```

Against a Vercel preview:

```bash
BASE_URL=https://sukull-com-git-pr-xyz.vercel.app \
TEST_ACCOUNT_EMAIL=… TEST_ACCOUNT_PASSWORD=… TEST_ACCOUNT_USERNAME=… \
npx playwright test
```

## Safety guards

- The `account-delete.spec.ts` suite refuses to run when `BASE_URL`
  points at `sukull.com` (production). It deletes the user it signs in
  as — running it against prod would cost us a real account.
- CI must seed and re-seed the `TEST_ACCOUNT_*` user between runs; the
  suite leaves the database without that row.

## Adding new specs

- One flow per file, named after the user-visible surface
  (e.g. `credit-purchase.spec.ts`, `teacher-onboarding.spec.ts`).
- Prefer role-based selectors (`getByRole`, `getByLabel`) over CSS —
  locale changes to Turkish strings must not break the test, only
  changes to the semantic structure should.
- Keep each spec under ~60 seconds. E2E is a smoke net, not a
  regression grid; deep validation belongs in Vitest or DB tests.
