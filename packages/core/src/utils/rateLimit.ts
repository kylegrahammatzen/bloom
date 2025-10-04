import type { SecondaryStorage } from '@/schemas/storage';
import { logger } from '@/utils/logger';

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

let hasLoggedStorageMode = false;

/**
 * Check if a rate limit has been exceeded using secondary storage if available
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  storage?: SecondaryStorage
): Promise<{ isLimited: boolean; remaining: number; resetAt?: Date }> {
  if (storage) {
    if (!hasLoggedStorageMode) {
      logger.debug('Using secondary storage for rate limiting');
      hasLoggedStorageMode = true;
    }
    return checkRateLimitWithStorage(key, config, storage);
  }
  if (!hasLoggedStorageMode) {
    logger.debug('Using in-memory storage for rate limiting');
    hasLoggedStorageMode = true;
  }
  return checkRateLimitInMemory(key, config);
}

/**
 * Track a new attempt for rate limiting using secondary storage if available
 */
export async function trackAttempt(key: string, storage?: SecondaryStorage): Promise<void> {
  if (storage) {
    return trackAttemptWithStorage(key, storage);
  }
  return trackAttemptInMemory(key);
}

async function checkRateLimitWithStorage(
  key: string,
  config: RateLimitConfig,
  storage: SecondaryStorage
): Promise<{ isLimited: boolean; remaining: number; resetAt?: Date }> {
  const storageKey = `ratelimit:${key}`;
  const attempt = await storage.get<RateLimitAttempt>(storageKey);

  if (!attempt) {
    return { isLimited: false, remaining: config.max };
  }

  const now = Date.now();
  if (now - attempt.firstAttemptAt > config.window) {
    await storage.delete(storageKey);
    return { isLimited: false, remaining: config.max };
  }

  if (attempt.count >= config.max) {
    const resetAt = new Date(attempt.firstAttemptAt + config.window);
    return { isLimited: true, remaining: 0, resetAt };
  }

  return { isLimited: false, remaining: config.max - attempt.count };
}

async function trackAttemptWithStorage(key: string, storage: SecondaryStorage): Promise<void> {
  const storageKey = `ratelimit:${key}`;
  const now = Date.now();
  const attempt = await storage.get<RateLimitAttempt>(storageKey);

  if (!attempt) {
    await storage.set(storageKey, {
      count: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
    }, Math.floor(24 * 60 * 60));
  } else {
    attempt.count++;
    attempt.lastAttemptAt = now;
    await storage.set(storageKey, attempt, Math.floor((attempt.firstAttemptAt + 24 * 60 * 60 * 1000 - now) / 1000));
  }
}

function checkRateLimitInMemory(
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

function trackAttemptInMemory(key: string): void {
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
