import type { BloomAuth, ApiMethodParams, User, Session, EventHandler } from './types'
import type { DatabaseAdapter } from './storage/adapter'
import type { Storage, RateLimitConfig } from './schemas'
import { getCookie } from './utils/headers'
import { parseSessionCookie } from './utils/cookies'
import { ApiMethodParamsSchema, RateLimitConfigSchema } from './schemas'
import { EventEmitter } from './events/emitter'
import { Router } from './handler/router'
import { createHandler } from './handler/handler'
import { RateLimiter } from './rateLimit/limiter'
import { handleRegister, handleLogin, handleLogout, type EmailPasswordConfig, type SessionConfig } from './api'

/**
 * Configuration options for BloomAuth
 */
export type BloomAuthConfig = {
  /**
   * Database adapter for persisting users and sessions
   */
  adapter: DatabaseAdapter

  /**
   * Session cookie name
   * @default 'bloom.sid'
   */
  cookieName?: string

  /**
   * Storage for rate limiting, session caching, and temporary data
   * When provided, rate limiting uses storage; otherwise falls back to database
   * @example
   * storage: redisStorage(redis)
   * storage: memoryStorage()
   */
  storage?: Storage

  /**
   * Rate limiting configuration
   * Auto-enabled in production, disabled in development
   * @example
   * rateLimit: {
   *   enabled: true,
   *   window: 60,
   *   max: 100,
   *   rules: {
   *     '/sign-in/email': { window: 10, max: 3 }
   *   }
   * }
   */
  rateLimit?: RateLimitConfig

  /**
   * Session configuration
   * @example
   * session: {
   *   expiresIn: 7 * 24 * 60 * 60,  // 7 days in seconds
   *   updateAge: 24 * 60 * 60,      // Update every 24 hours
   *   cookieCache: {
   *     enabled: true,
   *     maxAge: 5 * 60,             // 5 minutes
   *   },
   * }
   */
  session?: SessionConfig

  /**
   * Email/password authentication configuration
   * @example
   * emailPassword: {
   *   enabled: true,
   *   minPasswordLength: 8,
   *   maxPasswordLength: 128,
   *   requireEmailVerification: false,
   * }
   */
  emailPassword?: EmailPasswordConfig

  /**
   * Event listeners to register on initialization
   * @example
   * events: {
   *   'signup:complete': async (data) => {
   *     await sendWelcomeEmail(data.user.email)
   *   },
   *   'user:*': async (data) => {
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
 *     'session:found': async ({ user, session }) => {
 *       console.log('User session loaded:', user.email)
 *     }
 *   }
 * })
 */
export function bloomAuth(config: BloomAuthConfig): BloomAuth {
  const { adapter, storage, rateLimit } = config

  /** Session cookie name used for storing session data */
  const cookieName = config.cookieName ?? 'bloom.sid'

  /** Event emitter for lifecycle hooks and plugin communication */
  const emitter = new EventEmitter()

  /** Router for registering and matching HTTP routes */
  const router = new Router()

  // Register events from config
  if (config.events) {
    for (const [event, handler] of Object.entries(config.events)) {
      emitter.on(event, handler)
    }
  }

  // Create rate limiter if config provided
  let rateLimiter: RateLimiter | undefined
  if (rateLimit) {
    // Validate rate limit config
    const validatedConfig = RateLimitConfigSchema.parse(rateLimit)
    rateLimiter = new RateLimiter({
      config: validatedConfig,
      storage,
      adapter,
    })
  }

  /**
   * Universal HTTP handler (Web Standard Request → Response)
   * Handles all auth routes including core endpoints and plugin routes
   */
  const handler = createHandler({
    router,
    emitter,
    rateLimiter,
    basePath: '/auth',
  })

  // Register core routes
  router.register({
    path: '/session',
    method: 'GET',
    handler: async (ctx) => {
      const result = await getSessionFromContext(ctx)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  })

  router.register({
    path: '/register',
    method: 'POST',
    handler: async (ctx) => {
      return await handleRegister(ctx, adapter, emitter, config.emailPassword, config.session, cookieName)
    },
  })

  router.register({
    path: '/login',
    method: 'POST',
    handler: async (ctx) => {
      return await handleLogin(ctx, adapter, emitter, config.emailPassword, config.session, cookieName)
    },
  })

  router.register({
    path: '/logout',
    method: 'POST',
    handler: async (ctx) => {
      return await handleLogout(ctx, adapter, emitter, cookieName)
    },
  })

  // Helper to get session from context (extracted from getSession logic)
  async function getSessionFromContext(ctx: any) {
    const cookieValue = ctx.headers.get('cookie')
      ? getCookie({ cookie: ctx.headers.get('cookie') }, cookieName)
      : null

    if (!cookieValue) {
      return null
    }

    const sessionData = parseSessionCookie(cookieValue)
    if (!sessionData) {
      return null
    }

    const session = await adapter.session.findById(sessionData.sessionId)
    if (!session || session.userId !== sessionData.userId) {
      return null
    }

    const user = await adapter.user.findById(session.userId)
    if (!user) {
      return null
    }

    await adapter.session.updateLastAccessed(session.id)
    return { user, session }
  }

  /**
   * BloomAuth instance
   *
   * Provides:
   * - handler: Universal HTTP handler for all auth routes
   * - router: Register custom routes and plugins
   * - api: Direct API methods for server-side usage
   * - on/emit/off: Event system for lifecycle hooks
   */
  const auth: BloomAuth = {
    handler,
    router,

    api: {
      async getSession(params: ApiMethodParams): Promise<{ user: User; session: Session } | null> {
        // Emit: session lookup started
        await emitter.emit('session:loading', { params })

        // Validate input params at runtime
        const validatedParams = ApiMethodParamsSchema.safeParse(params)
        if (!validatedParams.success) {
          await emitter.emit('session:notfound', { reason: 'invalid_params' })
          return null
        }

        // Extract session cookie from framework-agnostic headers
        const cookieValue = validatedParams.data.headers
          ? getCookie(validatedParams.data.headers as any, cookieName)
          : null

        if (!cookieValue) {
          await emitter.emit('session:notfound', { reason: 'no_cookie' })
          return null
        }

        // Parse and validate session cookie JSON
        const sessionData = parseSessionCookie(cookieValue)
        if (!sessionData) {
          await emitter.emit('session:notfound', { reason: 'invalid_cookie' })
          return null
        }

        // Load session from adapter
        const session = await adapter.session.findById(sessionData.sessionId)
        if (!session) {
          await emitter.emit('session:notfound', { reason: 'session_not_found' })
          return null
        }

        // Verify session belongs to the user in the cookie
        if (session.userId !== sessionData.userId) {
          await emitter.emit('session:notfound', { reason: 'user_mismatch' })
          return null
        }

        // Load user from adapter
        const user = await adapter.user.findById(session.userId)
        if (!user) {
          await emitter.emit('session:notfound', { reason: 'user_not_found' })
          return null
        }

        // Emit: session found
        await emitter.emit('session:found', { user, session })

        // Update last accessed time
        await adapter.session.updateLastAccessed(session.id)

        // Emit: session accessed
        await emitter.emit('session:accessed', { user, session })

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
