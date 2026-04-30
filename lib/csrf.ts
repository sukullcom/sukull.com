import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf-constants";

const TOKEN_BYTES = 32;

export function newCsrfToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export function setCsrfCookie(response: NextResponse, token: string): void {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    path: "/",
    sameSite: "lax",
    secure,
    httpOnly: false,
    maxAge: 60 * 60 * 2,
  });
}

/** Double-submit: non-HttpOnly cookie must equal `x-csrf-token` header. */
export function verifyCsrf(request: NextRequest): boolean {
  const cookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const header = request.headers.get(CSRF_HEADER_NAME);
  if (!cookie || !header) return false;
  const a = Buffer.from(cookie, "utf8");
  const b = Buffer.from(header, "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
