/**
 * Configuration for a rate limiter instance.
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Prefix for identifying this limiter's keys (e.g., "api", "ai") */
  keyPrefix: string;
}

/**
 * Result of a rate limit check.
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Timestamp (ms) when the current window resets */
  resetAt: number;
  /** Total requests allowed per window */
  limit: number;
  /** Number of milliseconds until the window resets */
  retryAfterMs: number;
}

/**
 * In-memory rate limiter for API route protection.
 */
export interface RateLimiter {
  /** Check and consume a request against the rate limit for a given key */
  checkLimit: (key: string) => RateLimitResult;
  /** Reset the rate limit for a specific key */
  reset: (key: string) => void;
  /** Clear all tracked entries (useful for testing) */
  clearAll: () => void;
}

/** Internal tracking entry for a single key's request history */
interface RateLimitEntry {
  /** Request timestamps within the current window */
  timestamps: number[];
  /** When the current window started */
  windowStart: number;
}

/**
 * Creates an in-memory rate limiter with sliding window behavior.
 *
 * @param config - The rate limit configuration
 * @returns A RateLimiter instance
 *
 * @example
 * ```typescript
 * const limiter = createRateLimiter(RATE_LIMIT_PRESETS.apiGeneral);
 * const result = limiter.checkLimit(userId);
 * if (!result.allowed) {
 *   return new Response("Too many requests", { status: 429 });
 * }
 * ```
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  const entries = new Map<string, RateLimitEntry>();

  /** Periodically clean up expired entries to prevent memory leaks */
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of entries) {
      if (now - entry.windowStart > config.windowMs * 2) {
        entries.delete(key);
      }
    }
  }, config.windowMs);

  // Allow garbage collection of the interval when the process exits
  if (typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }

  /**
   * Gets the fully qualified key with prefix.
   */
  function getFullKey(key: string): string {
    return `${config.keyPrefix}:${key}`;
  }

  /**
   * Checks whether a request from the given key is within rate limits.
   * If allowed, records the request timestamp.
   */
  function checkLimit(key: string): RateLimitResult {
    const fullKey = getFullKey(key);
    const now = Date.now();

    let entry = entries.get(fullKey);

    if (!entry || now - entry.windowStart >= config.windowMs) {
      // Start a new window
      entry = { timestamps: [], windowStart: now };
      entries.set(fullKey, entry);
    }

    // Remove timestamps outside the current window (sliding window)
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < config.windowMs
    );

    const resetAt = entry.windowStart + config.windowMs;
    const retryAfterMs = Math.max(0, resetAt - now);

    if (entry.timestamps.length >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: config.maxRequests,
        retryAfterMs,
      };
    }

    // Record this request
    entry.timestamps.push(now);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.timestamps.length,
      resetAt,
      limit: config.maxRequests,
      retryAfterMs,
    };
  }

  /**
   * Resets the rate limit tracking for a specific key.
   */
  function reset(key: string): void {
    entries.delete(getFullKey(key));
  }

  /**
   * Clears all rate limit tracking entries.
   */
  function clearAll(): void {
    entries.clear();
  }

  return { checkLimit, reset, clearAll };
}

/**
 * Pre-configured rate limit presets for common use cases.
 */
export const RATE_LIMIT_PRESETS = {
  /** General API endpoints: 60 requests per minute */
  apiGeneral: {
    windowMs: 60_000,
    maxRequests: 60,
    keyPrefix: "api",
  },
  /** AI/Claude API calls: 10 requests per minute */
  aiCalls: {
    windowMs: 60_000,
    maxRequests: 10,
    keyPrefix: "ai",
  },
  /** File uploads: 5 requests per minute */
  uploads: {
    windowMs: 60_000,
    maxRequests: 5,
    keyPrefix: "upload",
  },
  /** Authentication attempts: 5 requests per minute */
  auth: {
    windowMs: 60_000,
    maxRequests: 5,
    keyPrefix: "auth",
  },
} as const satisfies Record<string, RateLimitConfig>;

/**
 * Generates standard rate limit response headers.
 *
 * @param result - The rate limit check result
 * @returns A record of HTTP headers to include in the response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed
      ? {}
      : { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) }),
  };
}
