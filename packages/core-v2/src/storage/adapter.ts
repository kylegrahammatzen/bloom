import type { User, Session } from '@/types'
import type { CreateUserData, UpdateUserData, CreateSessionData } from '@/schemas'

export type DatabaseAdapter = {
  // User operations
  user: {
    /**
     * Find user by ID
     * @returns User or null if not found
     */
    findById(id: string): Promise<User | null>

    /**
     * Find user by email (case-insensitive)
     * @returns User or null if not found
     */
    findByEmail(email: string): Promise<User | null>

    /**
     * Find user by email verification token
     * @returns User or null if not found
     */
    findByEmailVerificationToken(token: string): Promise<User | null>

    /**
     * Find user by password reset token
     * @returns User or null if not found
     */
    findByPasswordResetToken(token: string): Promise<User | null>

    /**
     * Create a new user
     * @returns Created user
     */
    create(data: CreateUserData): Promise<User>

    /**
     * Update user by ID
     * @returns Updated user or null if not found
     */
    update(id: string, data: UpdateUserData): Promise<User | null>

    /**
     * Delete user by ID
     * @returns True if deleted, false if not found
     */
    delete(id: string): Promise<boolean>
  }

  // Session operations
  session: {
    /**
     * Find session by ID
     * @returns Session or null if not found or expired
     */
    findById(id: string): Promise<Session | null>

    /**
     * Find all active sessions for a user
     * @returns Array of active sessions
     */
    findByUserId(userId: string): Promise<Session[]>

    /**
     * Create a new session
     * @returns Created session
     */
    create(data: CreateSessionData): Promise<Session>

    /**
     * Update session last accessed time
     * @returns Updated session or null if not found
     */
    updateLastAccessed(id: string): Promise<Session | null>

    /**
     * Delete session by ID
     * @returns True if deleted, false if not found
     */
    delete(id: string): Promise<boolean>

    /**
     * Delete all sessions for a user
     * @returns Number of sessions deleted
     */
    deleteByUserId(userId: string): Promise<number>

    /**
     * Delete all expired sessions
     * @returns Number of sessions deleted
     */
    deleteExpired(): Promise<number>
  }

  // Rate limiting operations (optional - used as fallback when no storage provided)
  rateLimit?: {
    /**
     * Increment rate limit counter for a key
     * Returns current count and whether request is allowed
     * @param key - Rate limit key (e.g., "ip:192.168.1.1:/sign-in/email")
     * @param window - Time window in seconds
     * @param max - Maximum requests in window
     * @returns Object with allowed status, current count, and retry info
     */
    increment(
      key: string,
      window: number,
      max: number
    ): Promise<{
      allowed: boolean
      count: number
      retryAfter?: number
      limit: number
      remaining: number
    }>

    /**
     * Clean up expired rate limit records
     * @returns Number of records deleted
     */
    cleanup(): Promise<number>
  }
}
