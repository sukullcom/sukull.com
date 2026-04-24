import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Unit coverage for `deleteMyAccount`.
 *
 * We focus on the early-exit branches — unauthenticated, rate-limited,
 * confirmation-mismatch — because they are the most valuable to guard as
 * regressions:
 *
 *   * Each is a *security-critical* boundary: breaking one silently means
 *     an attacker (or a buggy client) can trip the irreversible erasure.
 *   * Each runs with zero DB state, so we can assert return codes without
 *     building a full fixture.
 *
 * The happy-path (successful deletion across 10+ tables + Supabase Auth +
 * sign-out) is covered by the end-to-end smoke in `e2e/account-delete.spec.ts`.
 * That test exercises the real DB against a seeded throwaway user — only
 * reliable when run against a live preview environment, which is why it is
 * excluded from the default Vitest run.
 */

// `vi.mock` factories are hoisted above any top-level `const`, so
// mock functions referenced inside them must be created with
// `vi.hoisted()` to stay in scope.
const mocks = vi.hoisted(() => {
  type TestUser = { id: string; email: string | null; name: string | null };
  const findFirstMock = vi.fn<[], Promise<TestUser | null>>();
  const transactionMock = vi.fn();
  const getServerUserMock = vi.fn();
  const checkRateLimitMock = vi.fn();
  const logAdminActionMock = vi.fn();
  const redirectMock = vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  });
  const signOutMock = vi.fn().mockResolvedValue({ error: null });
  const deleteUserMock = vi.fn().mockResolvedValue({ error: null });
  const loggerChild = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
  loggerChild.child.mockReturnValue(loggerChild);
  return {
    findFirstMock,
    transactionMock,
    getServerUserMock,
    checkRateLimitMock,
    logAdminActionMock,
    redirectMock,
    signOutMock,
    deleteUserMock,
    loggerChild,
  };
});

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirectMock,
}));

vi.mock("@/lib/auth", () => ({
  getServerUser: mocks.getServerUserMock,
}));

vi.mock("@/lib/rate-limit-db", () => ({
  checkRateLimit: mocks.checkRateLimitMock,
  RATE_LIMITS: {
    accountDelete: { max: 3, windowSeconds: 24 * 60 * 60 },
  },
}));

vi.mock("@/lib/admin-audit", () => ({
  logAdminAction: mocks.logAdminActionMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: mocks.loggerChild,
}));

// --- DB layer mock --------------------------------------------------------
//
// The real module exports a Drizzle client whose `query.users.findFirst`
// and `transaction` / `delete` / `update` APIs are chained. Tests here only
// need to control `findFirst` (for the confirmation-phrase branch); every
// other path is short-circuited before those methods are touched.

vi.mock("@/db/drizzle", () => ({
  default: {
    query: {
      users: { findFirst: mocks.findFirstMock },
      userProgress: { findFirst: vi.fn().mockResolvedValue(null) },
    },
    transaction: mocks.transactionMock,
  },
}));

vi.mock("@/db/schema", () => ({
  users: { id: "users.id", email: "users.email", name: "users.name" },
  userProgress: { userId: "user_progress.user_id", schoolId: "…", points: "…" },
  schools: { id: "…", totalPoints: "…" },
  activityLog: { userId: "…" },
  challengeProgress: { userId: "…" },
  errorLog: { userId: "…" },
  privateLessonApplications: { userId: "…" },
  snippets: { userId: "…" },
  studyBuddyChats: { participants: "…" },
  studyBuddyMessages: { sender: "…" },
  studyBuddyPosts: { user_id: "…" },
  teacherApplications: { userId: "…" },
  userDailyChallenges: { userId: "…" },
  userDailyStreak: { userId: "…" },
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { signOut: mocks.signOutMock },
  }),
}));

vi.mock("@/utils/supabase/admin", () => ({
  getSupabaseAdminClient: vi.fn().mockReturnValue({
    auth: { admin: { deleteUser: mocks.deleteUserMock } },
  }),
}));

// Drizzle's sql/eq helpers are only used to build queries the mock never
// interprets, so a stub that returns a sentinel is enough.
vi.mock("drizzle-orm", () => {
  const sentinel = (tag: string) => ({ __sql: true, tag });
  return {
    eq: (...args: unknown[]) => sentinel(`eq(${JSON.stringify(args)})`),
    sql: Object.assign(() => sentinel("sql`…`"), {
      raw: () => sentinel("sql.raw"),
    }),
  };
});

import { deleteMyAccount } from "@/actions/account";

beforeEach(() => {
  vi.clearAllMocks();
  // Default "happy" setup so individual tests only override what they care
  // about. Rate limiter and user lookup both succeed by default.
  mocks.getServerUserMock.mockResolvedValue({ id: "user-123" });
  mocks.checkRateLimitMock.mockResolvedValue({
    allowed: true,
    remaining: 2,
    resetAt: new Date(),
  });
  mocks.findFirstMock.mockResolvedValue({
    id: "user-123",
    email: "u@example.com",
    name: "alice",
  });
});

describe("deleteMyAccount early-exit branches", () => {
  it("rejects when there is no authenticated user", async () => {
    mocks.getServerUserMock.mockResolvedValueOnce(null);

    const result = await deleteMyAccount("alice");

    expect(result).toEqual({ ok: false, code: "unauthenticated" });
    // Must not even consult the rate limiter for anonymous callers —
    // otherwise a flood of unauth calls can exhaust the per-key bucket
    // for a legitimate signed-in user who shares a proxy.
    expect(mocks.checkRateLimitMock).not.toHaveBeenCalled();
  });

  it("returns rate_limited when the per-user bucket is exhausted", async () => {
    mocks.checkRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60_000),
    });

    const result = await deleteMyAccount("alice");

    expect(result).toEqual({ ok: false, code: "rate_limited" });
    // Must never reach the DB when throttled — the whole point of the
    // rate limit is to protect the irreversible write path.
    expect(mocks.findFirstMock).not.toHaveBeenCalled();
    expect(mocks.transactionMock).not.toHaveBeenCalled();
  });

  it("returns unknown_user when the profile row has already been removed", async () => {
    mocks.findFirstMock.mockResolvedValueOnce(null);

    const result = await deleteMyAccount("alice");

    expect(result).toEqual({ ok: false, code: "unknown_user" });
    // A missing profile means the auth record is stale; we refuse to act
    // rather than touching any audit/transaction path.
    expect(mocks.logAdminActionMock).not.toHaveBeenCalled();
    expect(mocks.transactionMock).not.toHaveBeenCalled();
  });

  it("rejects a confirmation phrase that does not match the stored username", async () => {
    const result = await deleteMyAccount("ALICE"); // wrong case

    expect(result).toEqual({ ok: false, code: "confirmation_mismatch" });
    expect(mocks.transactionMock).not.toHaveBeenCalled();
  });

  it("treats an empty confirmation phrase as a mismatch, even if trimmed", async () => {
    const result = await deleteMyAccount("   ");

    expect(result).toEqual({ ok: false, code: "confirmation_mismatch" });
    expect(mocks.transactionMock).not.toHaveBeenCalled();
  });

  it("accepts the exact confirmation phrase and enters the destructive flow", async () => {
    // We stub the transaction so the test doesn't exercise the full
    // cascade — but entering the transaction at all proves the gating
    // logic above approved the request.
    mocks.transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      await callback({
        delete: () => ({ where: () => Promise.resolve() }),
        update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
        execute: () => Promise.resolve(),
        select: () => ({ from: () => ({ where: () => Promise.resolve([{ c: 0 }]) }) }),
      });
    });

    const result = await deleteMyAccount("alice");

    // Either `{ ok: true }` on the happy path, or `{ ok: false, code: "internal" }`
    // if a mocked downstream dependency threw — but *not* one of the
    // early-exit codes. That confirms the gate was crossed.
    expect(mocks.transactionMock).toHaveBeenCalledTimes(1);
    expect([
      "rate_limited",
      "unauthenticated",
      "confirmation_mismatch",
      "unknown_user",
    ]).not.toContain("code" in result ? result.code : undefined);
  });
});
