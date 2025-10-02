"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = checkRateLimit;
exports.trackAttempt = trackAttempt;
exports.resetRateLimit = resetRateLimit;
exports.cleanupOldAttempts = cleanupOldAttempts;
// In-memory storage for rate limiting attempts
const attempts = new Map();
/**
 * Check if a rate limit has been exceeded
 * @param key Unique identifier (IP address, email, etc.)
 * @param config Rate limit configuration
 * @returns Object with isLimited flag and remaining attempts
 */
function checkRateLimit(key, config) {
    const now = Date.now();
    const attempt = attempts.get(key);
    // Clean up expired attempt data
    if (attempt && now - attempt.firstAttemptAt > config.window) {
        attempts.delete(key);
        return { isLimited: false, remaining: config.max };
    }
    // No previous attempts
    if (!attempt) {
        return { isLimited: false, remaining: config.max };
    }
    // Check if limit exceeded
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
function trackAttempt(key) {
    const now = Date.now();
    const attempt = attempts.get(key);
    if (!attempt) {
        attempts.set(key, {
            count: 1,
            firstAttemptAt: now,
            lastAttemptAt: now,
        });
    }
    else {
        attempt.count++;
        attempt.lastAttemptAt = now;
        attempts.set(key, attempt);
    }
}
/**
 * Reset rate limit attempts for a specific key
 * @param key Unique identifier (IP address, email, etc.)
 */
function resetRateLimit(key) {
    attempts.delete(key);
}
/**
 * Clean up old rate limit attempts
 * Should be called periodically to prevent memory leaks
 * @param maxAge Maximum age in milliseconds (default: 1 hour)
 */
function cleanupOldAttempts(maxAge = 60 * 60 * 1000) {
    const now = Date.now();
    for (const [key, attempt] of attempts.entries()) {
        if (now - attempt.lastAttemptAt > maxAge) {
            attempts.delete(key);
        }
    }
}
// Clean up old attempts every 10 minutes
setInterval(() => cleanupOldAttempts(), 10 * 60 * 1000);
