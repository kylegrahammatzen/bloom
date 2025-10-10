import type { BloomAuth, ApiMethodParams, User, Session, EventHandler } from './types'
import type { DatabaseAdapter } from './storage/adapter'
import { getCookie } from './utils/headers'
import { parseSessionCookie } from './utils/cookies'
import { ApiMethodParamsSchema } from './schemas'
import { EventEmitter } from './events/emitter'

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

  /**
   * Event listeners to register on initialization
   * @example
   * events: {
   *   'signup.complete': async (data) => {
   *     await sendWelcomeEmail(data.user.email)
   *   },
   *   'user.*': async (data) => {
   *     console.log('User event:', data)
   *   }
   * }
   */
  events?: Record<string, EventHandler>

  /**
   * Raw database instance for plugin access
   * Plugins can use this to query custom tables
   */
  db?: any
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
 *   adapter: drizzleAdapter(db, { provider: 'pg' }),
 *   events: {
 *     'session.found': async ({ user, session }) => {
 *       console.log('User session loaded:', user.email)
 *     }
 *   }
 * })
 */
export function bloomAuth(config: BloomAuthConfig): BloomAuth {
  const { adapter } = config
  const cookieName = config.cookieName ?? 'bloom.sid'
  const emitter = new EventEmitter()

  // Register events from config
  if (config.events) {
    for (const [event, handler] of Object.entries(config.events)) {
      emitter.on(event, handler)
    }
  }

  const auth: BloomAuth = {
    api: {
      async getSession(params: ApiMethodParams): Promise<{ user: User; session: Session } | null> {
        // Emit: session lookup started
        await emitter.emit('session.loading', { params })

        // Validate input params at runtime
        const validatedParams = ApiMethodParamsSchema.safeParse(params)
        if (!validatedParams.success) {
          await emitter.emit('session.notfound', { reason: 'invalid_params' })
          return null
        }

        // Extract session cookie from framework-agnostic headers
        const cookieValue = validatedParams.data.headers
          ? getCookie(validatedParams.data.headers as any, cookieName)
          : null

        if (!cookieValue) {
          await emitter.emit('session.notfound', { reason: 'no_cookie' })
          return null
        }

        // Parse and validate session cookie JSON
        const sessionData = parseSessionCookie(cookieValue)
        if (!sessionData) {
          await emitter.emit('session.notfound', { reason: 'invalid_cookie' })
          return null
        }

        // Load session from adapter
        const session = await adapter.session.findById(sessionData.sessionId)
        if (!session) {
          await emitter.emit('session.notfound', { reason: 'session_not_found' })
          return null
        }

        // Verify session belongs to the user in the cookie
        if (session.userId !== sessionData.userId) {
          await emitter.emit('session.notfound', { reason: 'user_mismatch' })
          return null
        }

        // Load user from adapter
        const user = await adapter.user.findById(session.userId)
        if (!user) {
          await emitter.emit('session.notfound', { reason: 'user_not_found' })
          return null
        }

        // Emit: session found
        await emitter.emit('session.found', { user, session })

        // Update last accessed time
        await adapter.session.updateLastAccessed(session.id)

        // Emit: session accessed
        await emitter.emit('session.accessed', { user, session })

        return { user, session }
      }
    },

    // Event methods
    on: (event: string, handler: EventHandler) => emitter.on(event, handler),
    emit: (event: string, data?: any) => emitter.emit(event, data),
    off: (event: string, handler: EventHandler) => emitter.off(event, handler),
    events: {
      list: () => emitter.list(),
      listeners: (event: string) => emitter.getListeners(event),
    }
  }

  return auth
}
