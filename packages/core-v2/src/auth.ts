import type { BloomAuth, ApiMethodParams, User, Session } from './types'
import type { StorageAdapter } from './storage/adapter'
import { getCookie } from './utils/headers'
import { parseSessionCookie } from './utils/cookies'
import { ApiMethodParamsSchema } from './schemas'
import { InMemoryStorageAdapter } from './storage/in-memory'

/**
 * Configuration options for BloomAuth
 */
export type BloomAuthConfig = {
  /**
   * Storage adapter for persisting users and sessions
   * Defaults to in-memory storage (not suitable for production)
   */
  storage?: StorageAdapter

  /**
   * Session cookie name
   * @default 'bloom.sid'
   */
  cookieName?: string
}

/**
 * Create a BloomAuth instance
 *
 * This is the main entry point for Bloom Core v2
 * Includes runtime validation using Zod v4
 *
 * @example
 * // With default in-memory storage
 * const auth = bloomAuth()
 *
 * @example
 * // With custom storage adapter
 * const auth = bloomAuth({
 *   storage: new PostgresAdapter(pool)
 * })
 */
export function bloomAuth(config: BloomAuthConfig = {}): BloomAuth {
  const storage = config.storage ?? new InMemoryStorageAdapter()
  const cookieName = config.cookieName ?? 'bloom.sid'

  return {
    api: {
      async getSession(params: ApiMethodParams): Promise<{ user: User; session: Session } | null> {
        // Validate input params at runtime
        const validatedParams = ApiMethodParamsSchema.safeParse(params)
        if (!validatedParams.success) {
          return null
        }

        // Extract session cookie from framework-agnostic headers
        const cookieValue = validatedParams.data.headers
          ? getCookie(validatedParams.data.headers as any, cookieName)
          : null

        if (!cookieValue) {
          return null
        }

        // Parse and validate session cookie JSON
        const sessionData = parseSessionCookie(cookieValue)
        if (!sessionData) {
          return null
        }

        // Load session from storage
        const session = await storage.session.findById(sessionData.sessionId)
        if (!session) {
          return null
        }

        // Verify session belongs to the user in the cookie
        if (session.userId !== sessionData.userId) {
          return null
        }

        // Load user from storage
        const user = await storage.user.findById(session.userId)
        if (!user) {
          return null
        }

        // Update last accessed time
        await storage.session.updateLastAccessed(session.id)

        return { user, session }
      }
    }
  }
}
