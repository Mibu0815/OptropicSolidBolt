/**
 * Simple In-Memory Rate Limit Store
 * ----------------------------------
 * Tracks request counts per IP address with automatic cleanup
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  check(ip: string, windowMs: number, maxRequests: number): boolean {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || entry.resetTime < now) {
      this.store.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

export const rateLimitStore = new RateLimitStore();

export function checkRateLimit(
  ip: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number } {
  const allowed = rateLimitStore.check(ip, windowMs, maxRequests);
  return {
    allowed,
    remaining: maxRequests,
  };
}
