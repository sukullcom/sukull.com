import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { isTeacher as checkTeacherRole } from "@/db/queries";
import { getRequestLogger } from "@/lib/logger";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  type RateLimitOptions,
} from "@/lib/rate-limit-db";

/**
 * Thin wrappers around route handlers that enforce auth / role gates and
 * return consistent JSON error shapes. Kept intentionally minimal — any
 * rate limiting should be done via `@/lib/rate-limit-db` (distributed,
 * Postgres-backed) rather than re-implementing in memory here.
 */

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  role?: string;
};

export type RouteParams = Record<string, string | string[]> | undefined;

export type AuthenticatedHandler = (
  request: NextRequest,
  user: AuthenticatedUser,
  params?: RouteParams,
) => Promise<NextResponse>;

export type PublicHandler = (
  request: NextRequest,
  params?: RouteParams,
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, params?: RouteParams) => {
    try {
      const user = await getServerUser();

      if (!user) {
        return NextResponse.json(
          { error: "Giriş yapmanız gerekiyor." },
          { status: 401 },
        );
      }

      const authUser: AuthenticatedUser = {
        id: user.id,
        email: user.email || "",
        name: user.email || "",
        role: user.role,
      };

      return handler(request, authUser, params);
    } catch (error) {
      const log = await getRequestLogger();
      log.error({
        message: "api-middleware: withAuth failed",
        error,
        source: "api-route",
        location: "api-middleware/withAuth",
        fields: { path: request.nextUrl.pathname, method: request.method },
      });
      return NextResponse.json(
        { error: "Sunucu tarafında bir hata oluştu." },
        { status: 500 },
      );
    }
  };
}

export function withRole(roles: string[], handler: AuthenticatedHandler) {
  return withAuth(async (request, user, params) => {
    const userRole = user.role || "student";

    if (!roles.includes(userRole)) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 403 },
      );
    }

    return handler(request, user, params);
  });
}

export function withAdmin(handler: AuthenticatedHandler) {
  return withAuth(async (request, user, params) => {
    const isUserAdmin = await isAdmin();

    if (!isUserAdmin) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 403 },
      );
    }

    return handler(request, user, params);
  });
}

export function withTeacher(handler: AuthenticatedHandler) {
  return withAuth(async (request, user, params) => {
    const isUserTeacher = await checkTeacherRole(user.id);

    if (!isUserTeacher) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok." },
        { status: 403 },
      );
    }

    return handler(request, user, params);
  });
}

/**
 * Rate limit configuration for a route.
 *
 * `keyKind` controls whether the limit is scoped to the authenticated user
 * or to the source IP. Use `user` for POST/PUT/DELETE where the operation
 * modifies user-owned state (so one bad actor can't burn DB budget under
 * a shared NAT); use `ip` for anonymous or read-only endpoints.
 *
 * `bucket` is a short stable identifier that distinguishes limits across
 * different endpoints with the same scope (e.g. `book-lesson` vs `snippet-create`).
 */
export type RateLimitConfig = Omit<RateLimitOptions, "key"> & {
  bucket: string;
  keyKind: "user" | "ip";
};

function rateLimitKey(bucket: string, keyKind: "user" | "ip", scopeId: string) {
  return `${bucket}:${keyKind}:${scopeId}`;
}

async function enforceRateLimit(
  config: RateLimitConfig,
  scopeId: string,
): Promise<NextResponse | null> {
  const rl = await checkRateLimit({
    key: rateLimitKey(config.bucket, config.keyKind, scopeId),
    max: config.max,
    windowSeconds: config.windowSeconds,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen biraz bekleyin." },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }
  return null;
}

/**
 * IP-scoped rate limiter for PUBLIC routes (no auth required).
 *
 * Use for open read endpoints (search, listings, aggregations) where
 * abuse would trigger expensive DB scans. Pairs well with `unstable_cache`:
 * cache protects the normal case; rate-limit protects against uncached
 * adversarial query combinations.
 */
export function withPublicRateLimit(
  config: RateLimitConfig,
  handler: PublicHandler,
) {
  if (config.keyKind !== "ip") {
    throw new Error("withPublicRateLimit requires keyKind: 'ip'");
  }
  return async (request: NextRequest, params?: RouteParams) => {
    const block = await enforceRateLimit(config, getClientIp(request));
    if (block) return block;
    return handler(request, params);
  };
}

/**
 * Authenticated rate limiter. Wraps `withAuth` and adds a
 * per-user (default) or per-IP bucket before the handler runs.
 *
 * Cost shape:
 *   • Every call adds one round-trip to `check_rate_limit()` in Postgres.
 *   • That function is indexed, upsert-only, and returns in ~1ms typical.
 *   • Fail-open on DB errors (see `lib/rate-limit-db.ts`).
 */
export function withAuthRateLimit(
  config: RateLimitConfig,
  handler: AuthenticatedHandler,
) {
  return withAuth(async (request, user, params) => {
    const scopeId = config.keyKind === "user" ? user.id : getClientIp(request);
    const block = await enforceRateLimit(config, scopeId);
    if (block) return block;
    return handler(request, user, params);
  });
}

/**
 * Convenience collection of the auth wrappers above. Prefer these at call
 * sites instead of the individual `with*` exports — keeps the import tidy.
 *
 * `rateLimited` + `authRateLimited` are the preferred entry points at 10K+ MAU.
 */
export const secureApi = {
  public: (handler: PublicHandler) => handler,
  auth: withAuth,
  admin: withAdmin,
  teacher: withTeacher,
  role: withRole,
  rateLimited: withPublicRateLimit,
  authRateLimited: withAuthRateLimit,
};

/**
 * Standard JSON response helpers. Using these at every call site keeps
 * error shapes consistent across the API.
 */
export const ApiResponses = {
  success: (data: unknown) => NextResponse.json(data),
  created: (data: unknown) => NextResponse.json(data, { status: 201 }),
  badRequest: (message = "Geçersiz istek") =>
    NextResponse.json({ error: message }, { status: 400 }),
  unauthorized: (message = "Giriş yapmanız gerekiyor.") =>
    NextResponse.json({ error: message }, { status: 401 }),
  forbidden: (message = "Bu işlem için yetkiniz yok.") =>
    NextResponse.json({ error: message }, { status: 403 }),
  notFound: (message = "Bulunamadı") =>
    NextResponse.json({ error: message }, { status: 404 }),
  serverError: (message = "Sunucu tarafında bir hata oluştu.") =>
    NextResponse.json({ error: message }, { status: 500 }),
};
