/**
 * Hash a password using Argon2id with secure salt
 * @param password - The plaintext password to hash
 * @returns Promise containing the hash and salt as base64 strings
 */
export declare function hashPassword(password: string): Promise<{
    hash: string;
    salt: string;
}>;
/**
 * Verify a password against its hash using constant-time comparison
 * @param password - The plaintext password to verify
 * @param hash - The stored hash to compare against
 * @param salt - The salt used for the original hash (base64 encoded)
 * @returns Promise resolving to true if password matches, false otherwise
 */
export declare function verifyPassword(password: string, hash: string, salt: string): Promise<boolean>;
/**
 * Generate a cryptographically secure random token
 * @returns Base32 encoded token string (120 bits of entropy)
 */
export declare function generateSecureToken(): string;
/**
 * Hash a token with SHA-256 for secure storage
 * @param token - Token string to hash
 * @returns SHA-256 hash as hex string
 */
export declare function hashToken(token: string): string;
/**
 * Generate session ID with sufficient entropy
 * @returns 64-character hex string (256 bits of entropy)
 */
export declare function generateSessionId(): string;
/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if email format is valid and within length limits
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Normalize email address
 * @param email - Email address to normalize
 * @returns Lowercase, trimmed email address
 */
export declare function normalizeEmail(email: string): string;
/**
 * Check password strength
 * @param password - Password to validate
 * @returns Object containing strength assessment and issues
 */
export declare function checkPasswordStrength(password: string): {
    isStrong: boolean;
    issues: string[];
};
