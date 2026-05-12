/**
 * Express payment service origin (no trailing slash).
 *
 * Must stay in sync with browser checkout (`credit-purchase`, `subscription-purchase`):
 * production fallback when env is unset, so server-side 3DS finalize does not
 * default to localhost while the client used the real payment host (would yield
 * HTML 404 if localhost is wrong, or JSON 404 if URL points at the Next app).
 */

export function getPaymentServerBaseUrl(): string {
  const raw =
    (typeof process.env.PAYMENT_SERVER_URL === 'string' && process.env.PAYMENT_SERVER_URL.trim()) ||
    (typeof process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL === 'string' &&
      process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL.trim()) ||
    '';
  if (raw) return raw.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') {
    return 'https://sukullcom-production.up.railway.app';
  }
  return 'http://localhost:3001';
}
