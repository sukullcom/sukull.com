import type { NextRequest } from "next/server";

const isProd = process.env.NODE_ENV === "production";

function extraOriginsFromEnv(): string[] {
  const raw = process.env.ALLOWED_API_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Modül yükünde bir kez; her API isteğinde `new Set` maliyeti olmasın.
 * Ek kökenler: `ALLOWED_API_ORIGINS` (virgülle ayrılmış), örn. staging
 * `https://*.vercel.app` tek tek eklenir.
 */
const API_ALLOWED_ORIGINS = new Set<string>(
  [
    "https://sukull.com",
    "https://www.sukull.com",
    process.env.NEXT_PUBLIC_APP_URL,
    !isProd ? "http://localhost:3000" : null,
    ...extraOriginsFromEnv(),
  ].filter((v): v is string => typeof v === "string" && v.length > 0),
);

/**
 * `/api/*` CORS ve mutasyon köken doğrulaması için tek allow-list.
 * `middleware.ts` ile aynı kurallar; drift etmesin diye ortak modül.
 */
export function getApiAllowedOrigins(): Set<string> {
  return API_ALLOWED_ORIGINS;
}

/**
 * Tarayıcıdan gelen mutasyon isteklerinde `Origin` varsa allow-list ile doğrular.
 * Aynı-origin isteklerde çoğu zaman Origin olmaz; o durumda true döner.
 * (CSRF’i tamamen çözmez; SameSite=Lax çerez + bu kontrol riski azaltır.)
 */
export function isTrustedApiOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return API_ALLOWED_ORIGINS.has(origin);
}
