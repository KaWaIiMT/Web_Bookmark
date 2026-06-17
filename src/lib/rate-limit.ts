interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimiter {
  check(key: string): { success: boolean; remaining: number };
}

export function createRateLimiter(options: {
  intervalMs: number;
  maxRequests: number;
}): RateLimiter {
  const store = new Map<string, RateLimitEntry>();
  const { intervalMs, maxRequests } = options;

  // Periodic cleanup to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetTime) {
        store.delete(key);
      }
    }
  }, 60_000);

  return {
    check(key: string) {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now >= entry.resetTime) {
        store.set(key, { count: 1, resetTime: now + intervalMs });
        return { success: true, remaining: maxRequests - 1 };
      }

      if (entry.count >= maxRequests) {
        return { success: false, remaining: 0 };
      }

      entry.count++;
      return { success: true, remaining: maxRequests - entry.count };
    },
  };
}

// Pre-configured limiters
export const loginLimiter = createRateLimiter({
  intervalMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
});

export const registerLimiter = createRateLimiter({
  intervalMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
});
