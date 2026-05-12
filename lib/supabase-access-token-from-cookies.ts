/**
 * Read Supabase session access_token from RequestCookie / CookieStore shapes.
 *
 * `@supabase/ssr` may split large sessions across `sb-<ref>-auth-token.0`, `.1`, …
 * Middleware already detects `includes('-auth-token')`; older 3DS pages used
 * `endsWith('-auth-token')` and missed chunked cookies → finalize had no Bearer.
 */

type NamedCookie = { name: string; value: string };

function decodeSupabaseAuthCookieValue(raw: string): string | null {
  try {
    let payload = raw;
    if (payload.startsWith('base64-')) payload = payload.slice('base64-'.length);
    payload = decodeURIComponent(payload);
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4 !== 0) payload += '=';
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const json = JSON.parse(decoded) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

/** Same join order as `@supabase/ssr` combineChunks for the auth storage key. */
function combineChunkedCookieValues(
  cookiesList: ReadonlyArray<NamedCookie>,
  baseKey: string,
): string | null {
  const exact = cookiesList.find((c) => c.name === baseKey);
  if (exact?.value) return exact.value;

  const parts: string[] = [];
  for (let i = 0; i < 16; i += 1) {
    const c = cookiesList.find((c) => c.name === `${baseKey}.${i}`);
    if (!c?.value) break;
    parts.push(c.value);
  }
  if (parts.length > 0) return parts.join('');
  return null;
}

/**
 * Returns first valid `access_token` found among all `sb-*-auth-token*` cookies.
 */
export function extractAccessTokenFromSupabaseCookies(
  cookiesList: ReadonlyArray<NamedCookie>,
): string | null {
  const authCookies = cookiesList.filter(
    (c) => c.name.startsWith('sb-') && c.name.includes('auth-token'),
  );
  if (authCookies.length === 0) return null;

  const baseKeys = new Set<string>();
  for (const c of authCookies) {
    baseKeys.add(c.name.replace(/\.\d+$/, ''));
  }

  for (const base of Array.from(baseKeys)) {
    const raw = combineChunkedCookieValues(authCookies, base);
    if (!raw) continue;
    const token = decodeSupabaseAuthCookieValue(raw);
    if (token) return token;
  }
  return null;
}
