/**
 * Utility functions for handling avatar URLs in Next.js Image components
 */

/**
 * Normalizes an avatar URL to ensure it works with Next.js Image component
 * - If it's a relative path without leading slash, add one
 * - If it's a full HTTP/HTTPS URL, return as is
 * - If empty/null/undefined, return default mascot
 */
export function normalizeAvatarUrl(url: string | null | undefined): string {
  // If empty, null, or undefined, return default
  if (!url || url.trim() === '') {
    return '/mascot_purple.svg';
  }

  const trimmedUrl = url.trim();

  // If it's already a full URL (http/https), return as is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // If it's already a proper relative path (starts with /), return as is
  if (trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }

  // If it's a relative path without leading slash, add one
  // This fixes the Next.js Image component error
  return `/${trimmedUrl}`;
}

/**
 * Get avatar URL with fallback to default mascot
 */
export function getAvatarUrlWithFallback(
  primaryUrl?: string | null,
  fallbackUrl?: string | null
): string {
  const primary = normalizeAvatarUrl(primaryUrl);
  if (primary !== '/mascot_purple.svg') {
    return primary;
  }
  
  const fallback = normalizeAvatarUrl(fallbackUrl);
  return fallback;
} 