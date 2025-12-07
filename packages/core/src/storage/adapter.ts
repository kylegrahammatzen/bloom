import type { User, Session } from '@/types'
import type { CreateUserData, UpdateUserData, CreateSessionData } from '@/schemas'

export type DatabaseAdapter = {
  /**
   * User management operations
   *
   * Handles user CRUD operations, authentication lookups, and token-based user retrieval
   */
  user: {
    /**
     * Find user by ID
     * @param id - User ID to search for
     * @returns User or null if not found
     */
    findById(id: string): Promise<User | null>

    /**
     * Find user by email (case-insensitive)
     * @param email - Email address to search for
     * @returns User or null if not found
     */
    findByEmail(email: string): Promise<User | null>

    /**
     * Find user by email verification token
     * @param token - Email verification token to search for
     * @returns User or null if not found or token expired
     */
    findByEmailVerificationToken(token: string): Promise<User | null>

    /**
     * Find user by password reset token
     * @param token - Password reset token to search for
     * @returns User or null if not found or token expired
     */
    findByPasswordResetToken(token: string): Promise<User | null>

    /**
     * Create a new user
     * @param data - User creation data including email, password hash, and salt
     * @returns Created user with generated ID and timestamps
     */
    create(data: CreateUserData): Promise<User>

    /**
     * Update user by ID
     * @param id - User ID to update
     * @param data - Partial user data to update
     * @returns Updated user or null if not found
     */
    update(id: string, data: UpdateUserData): Promise<User | null>

    /**
     * Delete user by ID
     * @param id - User ID to delete
     * @returns True if deleted, false if not found
     */
    delete(id: string): Promise<boolean>
  }

  /**
   * Session management operations
   *
   * Handles session CRUD operations, session cleanup, and multi-session management
   */
  session: {
    /**
     * Find session by ID
     * @param id - Session ID to search for
     * @returns Session or null if not found or expired
     */
    findById(id: string): Promise<Session | null>

    /**
     * Find all active sessions for a user
     * @param userId - User ID to find sessions for
     * @returns Array of active (non-expired) sessions
     */
    findByUserId(userId: string): Promise<Session[]>

    /**
     * Create a new session
     * @param data - Session creation data including session ID, user ID, and expiration
     * @returns Created session with timestamps
     */
    create(data: CreateSessionData): Promise<Session>

    /**
     * Update session last accessed time
     * @param id - Session ID to update
     * @returns Updated session or null if not found
     */
    updateLastAccessed(id: string): Promise<Session | null>

    /**
     * Delete session by ID
     * @param id - Session ID to delete
     * @returns True if deleted, false if not found
     */
    delete(id: string): Promise<boolean>

    /**
     * Delete all sessions for a user
     * @param userId - User ID to delete sessions for
     * @returns Number of sessions deleted
     */
    deleteByUserId(userId: string): Promise<number>

    /**
     * Delete all expired sessions
     * @returns Number of sessions deleted
     */
    deleteExpired(): Promise<number>
  }

  /**
   * Rate limiting operations (optional)
   *
   * Used as fallback when no storage layer is provided.
   * Typically handled by Storage layer (Redis, Memory) for production use.
   */
  rateLimit?: {
    /**
     * Increment rate limit counter for a key
     *
     * Checks if request is within rate limit and increments counter.
     * Uses sliding window algorithm for accurate rate limiting.
     *
     * @param key - Rate limit key (e.g., "ip:192.168.1.1:/sign-in/email")
     * @param window - Time window in seconds
     * @param max - Maximum requests allowed in window
     * @returns Object containing:
     *   - `allowed`: Whether request is within rate limit
     *   - `count`: Current request count in window
     *   - `limit`: Maximum requests allowed
     *   - `remaining`: Requests remaining in window
     *   - `retryAfter`: Seconds until rate limit resets (if blocked)
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
     *
     * Should be called periodically to prevent memory leaks
     *
     * @returns Number of expired records deleted
     */
    cleanup(): Promise<number>
  }
}
