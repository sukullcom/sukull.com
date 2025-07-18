// utils/rate-limit.ts
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 15 * 60 * 1000, maxAttempts: 5 }
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now();
  const resetTime = now + config.windowMs;
  
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    // First attempt or window expired
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
      resetTime
    };
  }
  
  if (entry.count >= config.maxAttempts) {
    // Rate limit exceeded
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);
  
  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - entry.count,
    resetTime: entry.resetTime
  };
}

export function getClientIP(request: Request): string {
  // Try to get the real IP from headers (for production behind proxy)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || xRealIP || xForwardedFor?.split(',')[0] || 'unknown';
} 