import { createHmac, timingSafeEqual } from "node:crypto";

const PURPOSE = "marketplace-digest";

export function signDigestToken(userId: string, secret: string): string {
  const mac = createHmac("sha256", secret).update(`${PURPOSE}:${userId}`).digest("base64url");
  return `${userId}.${mac}`;
}

export function readDigestToken(token: string, secret: string): string | null {
  const split = token.lastIndexOf(".");
  if (split <= 0) return null;
  const userId = token.slice(0, split);
  const mac = token.slice(split + 1);
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !secret) return null;
  const expected = createHmac("sha256", secret).update(`${PURPOSE}:${userId}`).digest("base64url");
  const given = Buffer.from(mac);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;
  return userId;
}

export function digestSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  return secret || null;
}
