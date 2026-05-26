/**
 * Client-safe accent presets for promotion banners.
 *
 * NOTE: This module is intentionally separate from `lib/promotions.ts`
 * (which is `"server-only"`) so that client components can import the
 * accent list as a plain value. Re-exporting a non-async constant from
 * a `"use server"` file would otherwise be transformed by Next into a
 * server reference proxy and crash with `R.map is not a function` at
 * render time.
 */
export const PROMOTION_ACCENTS = [
  "violet",
  "amber",
  "rose",
  "emerald",
  "sky",
] as const;

export type PromotionAccent = (typeof PROMOTION_ACCENTS)[number];

export function isPromotionAccent(
  value: string | null | undefined,
): value is PromotionAccent {
  return !!value && (PROMOTION_ACCENTS as readonly string[]).includes(value);
}

export const PROMOTION_ACCENT_CHOICES: readonly PromotionAccent[] =
  PROMOTION_ACCENTS;
