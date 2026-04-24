/**
 * End-to-end smoke: self-service account deletion.
 *
 * ## Status: opt-in
 *
 * Playwright is **not** in the default devDependencies — installing it
 * drags ~200 MB of prebuilt browser binaries and a second test runner
 * into every `npm install`. To keep the baseline install fast for
 * contributors who never touch the UI, this file is gated behind a
 * manual install step:
 *
 * ```
 * npm i -D @playwright/test
 * npx playwright install chromium
 * npx playwright test e2e/account-delete.spec.ts
 * ```
 *
 * The Vitest suite at `tests/account-delete.test.ts` covers the same
 * boundary conditions (unauthenticated, rate-limited, confirmation
 * mismatch, destructive flow entry) as pure unit tests, so the Playwright
 * suite layered on top only needs to verify the *browser-visible*
 * contract: the UI renders correctly, the confirm-by-typing input gates
 * the submit, and the post-delete redirect lands the user on the public
 * marketing root.
 *
 * ## Required environment
 *
 * This spec **must not** run against production. It deletes the user it
 * signs in as. The CI runner should:
 *
 *   1. Point `BASE_URL` at a preview deployment (Vercel preview URL or
 *      local dev server).
 *   2. Seed a disposable account (`TEST_ACCOUNT_EMAIL` / `TEST_ACCOUNT_PASSWORD`
 *      / `TEST_ACCOUNT_USERNAME`) in the target database before the
 *      suite runs, and re-seed between runs.
 *   3. Never set `PROD=1` — the assertion below refuses to run against a
 *      URL containing `sukull.com` to prevent a production mis-config.
 *
 * ## Scope
 *
 * We exercise exactly one happy-path flow:
 *
 *   login → profile → settings tab → "Hesabımı Sil" dialog →
 *     (a) submit with wrong phrase → expect UI error, no redirect
 *     (b) submit with correct phrase → expect redirect to `/` with `?deleted=1`
 *
 * Everything else (rate-limit headers, audit rows, points reversal) is
 * covered by unit tests and server-side integration tests.
 */

// @ts-expect-error Playwright types are not installed by default; the
// runtime require happens only when the suite is invoked via the
// `playwright` binary, which loads its own types on disk.
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_ACCOUNT_EMAIL;
const PASSWORD = process.env.TEST_ACCOUNT_PASSWORD;
const USERNAME = process.env.TEST_ACCOUNT_USERNAME;

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  if (/sukull\.com$/i.test(new URL(BASE_URL).hostname)) {
    throw new Error(
      "Account-deletion E2E refuses to run against production. " +
        "Point BASE_URL at a preview/staging deployment.",
    );
  }
  if (!EMAIL || !PASSWORD || !USERNAME) {
    throw new Error(
      "Missing TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD / TEST_ACCOUNT_USERNAME env vars.",
    );
  }
});

test("user can self-delete via the profile danger-zone", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel(/e-posta/i).fill(EMAIL!);
  await page.getByLabel(/şifre/i).fill(PASSWORD!);
  await page.getByRole("button", { name: /giriş yap/i }).click();

  // Redirect can land on `/learn` or `/profile` depending on onboarding
  // state; either is fine as long as we're authenticated.
  await page.waitForURL(/\/(learn|profile|home)/, { timeout: 15_000 });

  await page.goto(`${BASE_URL}/profile`);
  await page.getByRole("button", { name: /ayarlar/i }).click();

  // Danger zone is dynamically imported; give it a moment to mount.
  const dangerButton = page.getByRole("button", { name: /hesabımı sil/i });
  await expect(dangerButton).toBeVisible({ timeout: 10_000 });
  await dangerButton.click();

  const input = page.getByLabel(/kullanıcı adını yaz/i);
  const confirm = page.getByRole("button", { name: /kalıcı olarak sil/i });

  // (a) Negative test: typing the wrong value must keep the submit disabled.
  await input.fill("definitely-not-me");
  await expect(confirm).toBeDisabled();

  // (b) Positive test: exact username unlocks the submit.
  await input.fill(USERNAME!);
  await expect(confirm).toBeEnabled();
  await confirm.click();

  // Server action redirects to `/?deleted=1`. Cookie cleared, middleware
  // no longer has a session — landing page should render the public
  // marketing variant.
  await page.waitForURL(new RegExp(`${new URL(BASE_URL).origin}/\\?deleted=1$`), {
    timeout: 15_000,
  });

  // Re-visiting /profile must now bounce us back to /login because the
  // protected layout lost its server-side user.
  await page.goto(`${BASE_URL}/profile`);
  await page.waitForURL(/\/login/, { timeout: 10_000 });
});
