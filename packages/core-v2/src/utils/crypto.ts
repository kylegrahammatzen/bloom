import * as argon2 from 'argon2'
import { randomBytes, createHash, timingSafeEqual } from 'crypto'

/**
 * Argon2id configuration for password hashing
 * Recommended settings for security and performance balance
 */
const ARGON2_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024, // 19 MB
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
}

/**
 * Hash a password using Argon2id with secure random salt
 *
 * @param password - Plaintext password to hash
 * @returns Promise with hash and salt as base64 strings
 *
 * @example
 * const { hash, salt } = await hashPassword('myPassword123')
 * // Store hash and salt in database
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  try {
    const salt = randomBytes(32)
    const hash = await argon2.hash(password, {
      ...ARGON2_CONFIG,
      salt,
    })

    return {
      hash,
      salt: salt.toString('base64'),
    }
  } catch (error) {
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify password against stored hash using constant-time comparison
 *
 * @param password - Plaintext password to verify
 * @param hash - Stored hash to compare against
 * @param salt - Salt used for original hash (base64 encoded)
 * @returns Promise resolving to true if password matches
 *
 * @example
 * const isValid = await verifyPassword('myPassword123', storedHash, storedSalt)
 */
export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  try {
    const saltBuffer = Buffer.from(salt, 'base64')
    const newHash = await argon2.hash(password, {
      ...ARGON2_CONFIG,
      salt: saltBuffer,
    })

    return timingSafeEqual(Buffer.from(hash), Buffer.from(newHash))
  } catch {
    return false
  }
}

/**
 * Generate cryptographically secure random token
 *
 * @returns Base32 encoded token (120 bits of entropy, lowercase)
 *
 * @example
 * const token = generateSecureToken()
 * // Use for email verification, password reset, etc.
 */
export function generateSecureToken(): string {
  const bytes = randomBytes(15)
  return encodeBase32(bytes)
}

/**
 * Custom Base32 encoding using RFC 4648 alphabet
 * @internal
 */
function encodeBase32(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  let bits = 0
  let value = 0

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8

    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31]
  }

  return result.toLowerCase()
}

/**
 * Hash token with SHA-256 for secure storage
 *
 * @param token - Token string to hash
 * @returns SHA-256 hash as hex string
 *
 * @example
 * const tokenHash = hashToken(token)
 * // Store hash in database, send raw token to user
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Generate session ID with high entropy
 *
 * @returns 64-character hex string (256 bits of entropy)
 *
 * @example
 * const sessionId = generateSessionId()
 */
export function generateSessionId(): string {
  const bytes = randomBytes(32)
  return bytes.toString('hex')
}

/**
 * Validate email format
 *
 * @param email - Email address to validate
 * @returns True if email format is valid and within length limits
 *
 * @example
 * if (isValidEmail('user@example.com')) {
 *   // Email is valid
 * }
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Normalize email address
 *
 * @param email - Email address to normalize
 * @returns Lowercase, trimmed email
 *
 * @example
 * const normalized = normalizeEmail('  User@Example.COM  ')
 * // Returns: 'user@example.com'
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Check password strength requirements
 *
 * @param password - Password to validate
 * @returns Object with strength assessment and list of issues
 *
 * @example
 * const { isStrong, issues } = checkPasswordStrength('weak')
 * if (!isStrong) {
 *   console.log('Password issues:', issues)
 * }
 */
export function checkPasswordStrength(password: string): {
  isStrong: boolean
  issues: string[]
} {
  const issues: string[] = []

  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long')
  }

  if (password.length > 256) {
    issues.push('Password must be less than 256 characters')
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push('Password must contain at least one special character')
  }

  return {
    isStrong: issues.length === 0,
    issues,
  }
}
