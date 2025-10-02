type RateLimitConfig = {
    max: number;
    window: number;
};
/**
 * Check if a rate limit has been exceeded
 * @param key Unique identifier (IP address, email, etc.)
 * @param config Rate limit configuration
 * @returns Object with isLimited flag and remaining attempts
 */
export declare function checkRateLimit(key: string, config: RateLimitConfig): {
    isLimited: boolean;
    remaining: number;
    resetAt?: Date;
};
/**
 * Track a new attempt for rate limiting
 * @param key Unique identifier (IP address, email, etc.)
 */
export declare function trackAttempt(key: string): void;
/**
 * Reset rate limit attempts for a specific key
 * @param key Unique identifier (IP address, email, etc.)
 */
export declare function resetRateLimit(key: string): void;
/**
 * Clean up old rate limit attempts
 * Should be called periodically to prevent memory leaks
 * @param maxAge Maximum age in milliseconds (default: 1 hour)
 */
export declare function cleanupOldAttempts(maxAge?: number): void;
export {};
