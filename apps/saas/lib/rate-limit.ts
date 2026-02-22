/**
 * In-memory sliding-window rate limiter.
 *
 * Each unique key (IP + endpoint) gets a bucket that tracks request timestamps
 * within the configured window. Stale entries are pruned automatically.
 *
 * For multi-instance / serverless production deployments, replace the Map
 * with a Redis-backed store (e.g. @upstash/ratelimit).
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed within the window */
  max: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Milliseconds until the window resets (for Retry-After header) */
  resetMs: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of stale entries every 60 seconds
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of Array.from(store.entries())) {
    // Remove entries whose newest timestamp is older than any reasonable window (1 hour)
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 3_600_000) {
      store.delete(key);
    }
  }
}

/**
 * Check and consume a rate limit token.
 *
 * @param ip      - Client IP address
 * @param endpoint - Endpoint identifier (e.g. 'public/bookings')
 * @param options  - Window size and max requests
 * @returns Whether the request is allowed, remaining quota, and reset time
 */
export function rateLimit(
  ip: string,
  endpoint: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const key = `${ip}:${endpoint}`;
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the current window
  const windowStart = now - options.windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  const remaining = Math.max(0, options.max - entry.timestamps.length);
  const oldestInWindow = entry.timestamps[0] ?? now;
  const resetMs = Math.max(0, oldestInWindow + options.windowMs - now);

  if (entry.timestamps.length >= options.max) {
    return { success: false, remaining: 0, resetMs };
  }

  entry.timestamps.push(now);
  return { success: true, remaining: remaining - 1, resetMs };
}

/**
 * Build a standard 429 JSON response with Retry-After header.
 */
export function rateLimitResponse(resetMs: number): Response {
  const retryAfterSeconds = Math.ceil(resetMs / 1000);
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Too many requests. Please try again later.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}
