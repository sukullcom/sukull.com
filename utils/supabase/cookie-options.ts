/**
 * Auth cookie lifetime. Access JWTs still rotate (~1h); the refresh
 * token in this cookie keeps the browser signed in until the user
 * explicitly logs out (or the browser drops the cookie).
 *
 * Chrome caps persistent cookies at 400 days.
 */
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

export const AUTH_COOKIE_OPTIONS = {
  maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax" as const,
};
