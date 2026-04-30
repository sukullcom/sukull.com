/**
 * Browser-only helpers: mint CSRF via `/api/csrf` and build headers for
 * mutating fetches (double-submit cookie + `x-csrf-token`).
 */
import { CSRF_HEADER_NAME } from "@/lib/csrf-constants";

export async function mintCsrfToken(): Promise<string | null> {
  const res = await fetch("/api/csrf", {
    method: "GET",
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as { csrfToken?: string };
  if (!res.ok || !data.csrfToken) return null;
  return data.csrfToken;
}

export function csrfHeader(token: string): Record<string, string> {
  return { [CSRF_HEADER_NAME]: token };
}
