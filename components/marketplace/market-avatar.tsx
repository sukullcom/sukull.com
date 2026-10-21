"use client";

import Image from "next/image";
import { useState } from "react";

import { BRAND_MASCOT_DISPLAY_PATH } from "@/lib/brand-mascot";

/** Eski varsayılan avatar 1,4 MB SVG; Vercel görsel optimizasyonu bunu reddediyor. */
const LEGACY_DEFAULTS = new Set(["/mascot_purple.svg", "mascot_purple.svg"]);

function resolve(src: string | null | undefined): { url: string; unoptimized: boolean } {
  const value = (src ?? "").trim();
  if (!value || LEGACY_DEFAULTS.has(value)) return { url: BRAND_MASCOT_DISPLAY_PATH, unoptimized: false };
  if (value.startsWith("/")) return { url: value, unoptimized: value.endsWith(".svg") };
  // Uzak avatarlar zaten küçük (Google ~96 px, yüklenenler 320 px); Vercel görsel
  // optimizasyonu kullanıcı başına ayrı kaynak sayıldığı için ücretli kotayı harcamasın.
  try {
    const { protocol } = new URL(value);
    if (protocol !== "https:" && protocol !== "http:") throw new Error("protocol");
    return { url: value, unoptimized: true };
  } catch {
    return { url: BRAND_MASCOT_DISPLAY_PATH, unoptimized: false };
  }
}

export function MarketAvatar({
  src,
  size = 44,
  className = "",
}: {
  src: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = failed ? { url: BRAND_MASCOT_DISPLAY_PATH, unoptimized: false } : resolve(src);
  return (
    <Image
      src={resolved.url}
      alt=""
      width={size}
      height={size}
      unoptimized={resolved.unoptimized}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full bg-suk-brand-soft object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
