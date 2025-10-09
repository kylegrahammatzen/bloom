import type { BloomAuth, ApiMethodParams, User, Session } from './types'
import type { DatabaseAdapter } from './storage/adapter'
import { getCookie } from './utils/headers'
import { parseSessionCookie } from './utils/cookies'
import { ApiMethodParamsSchema } from './schemas'

/**
 * Configuration options for BloomAuth
 */
export type BloomAuthConfig = {
  /**
   * Database adapter for persisting users and sessions
   * Required - use drizzleAdapter, kyselyAdapter, prismaAdapter, or mongodbAdapter
   */
  adapter: DatabaseAdapter

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
 * // With Drizzle adapter
 * const auth = bloomAuth({
 *   adapter: drizzleAdapter(db, { provider: 'pg' })
 * })
 */
export function bloomAuth(config: BloomAuthConfig): BloomAuth {
  const { adapter } = config
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

        // Load session from adapter
        const session = await adapter.session.findById(sessionData.sessionId)
        if (!session) {
          return null
        }

        // Verify session belongs to the user in the cookie
        if (session.userId !== sessionData.userId) {
          return null
        }

        // Load user from adapter
        const user = await adapter.user.findById(session.userId)
        if (!user) {
          return null
        }

        // Update last accessed time
        await adapter.session.updateLastAccessed(session.id)

        return { user, session }
      }
    }
  }
}
