type RateLimitAttempt = {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
}

type RateLimitConfig = {
  max: number;
  window: number;
}

const attempts = new Map<string, RateLimitAttempt>();

/**
 * Check if a rate limit has been exceeded
 * @param key Unique identifier (IP address, email, etc.)
 * @param config Rate limit configuration
 * @returns Object with isLimited flag and remaining attempts
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { isLimited: boolean; remaining: number; resetAt?: Date } {
  const now = Date.now();
  const attempt = attempts.get(key);

  if (attempt && now - attempt.firstAttemptAt > config.window) {
    attempts.delete(key);
    return { isLimited: false, remaining: config.max };
  }

  if (!attempt) {
    return { isLimited: false, remaining: config.max };
  }

  if (attempt.count >= config.max) {
    const resetAt = new Date(attempt.firstAttemptAt + config.window);
    return { isLimited: true, remaining: 0, resetAt };
  }

  return { isLimited: false, remaining: config.max - attempt.count };
}

/**
 * Track a new attempt for rate limiting
 * @param key Unique identifier (IP address, email, etc.)
 */
export function trackAttempt(key: string): void {
  const now = Date.now();
  const attempt = attempts.get(key);

  if (!attempt) {
    attempts.set(key, {
      count: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
    });
  } else {
    attempt.count++;
    attempt.lastAttemptAt = now;
    attempts.set(key, attempt);
  }
}

/**
 * Reset rate limit attempts for a specific key
 * @param key Unique identifier (IP address, email, etc.)
 */
export function resetRateLimit(key: string): void {
  attempts.delete(key);
}

/**
 * Clean up old rate limit attempts
 * Should be called periodically to prevent memory leaks
 * @param maxAge Maximum age in milliseconds (default: 1 hour)
 */
export function cleanupOldAttempts(maxAge: number = 60 * 60 * 1000): void {
  const now = Date.now();
  for (const [key, attempt] of attempts.entries()) {
    if (now - attempt.lastAttemptAt > maxAge) {
      attempts.delete(key);
    }
  }
}

setInterval(() => cleanupOldAttempts(), 10 * 60 * 1000);
