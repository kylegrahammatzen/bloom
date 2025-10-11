import type { BloomAuth, ApiMethodParams, User, Session, EventHandler } from '@/types'
import type { DatabaseAdapter } from '@/storage/adapter'
import type { Storage, RateLimitConfig } from '@/schemas'
import { getCookie } from '@/utils/headers'
import { parseSessionCookie } from '@/utils/cookies'
import { ApiMethodParamsSchema, RateLimitConfigSchema } from '@/schemas'
import { EventEmitter } from '@/events/emitter'
import { Router } from '@/handler/router'
import { createHandler } from '@/handler/handler'
import { RateLimiter } from '@/rateLimit/limiter'
import {
  register,
  login,
  logout,
  getSessions,
  deleteSession,
  deleteAllSessions,
  sendVerificationEmail,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  type EmailPasswordConfig,
  type SessionConfig,
} from '@/api'

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
   * Hooks to run before/after specific endpoints
   * @example
   * hooks: {
   *   '/register': {
   *     after: async (ctx) => {
   *       await sendWelcomeEmail(ctx.user.email)
   *     }
   *   },
   *   '/send-verification-email': {
   *     after: async (ctx) => {
   *       await sendVerificationEmail(ctx.body.email, ctx.body.token)
   *     }
   *   }
   * }
   */
  hooks?: Record<string, {
    before?: (ctx: import('./handler/context').Context) => Promise<void | Response>
    after?: (ctx: import('./handler/context').Context) => Promise<void | Response>
  }>

  /**
   * Raw database instance for plugin access
   * Plugins can use this to query custom tables
   */
  db?: any
}

/**
 * Create a BloomAuth instance
 *
 * @example
 * const auth = bloomAuth({
 *   adapter: drizzleAdapter(db, { provider: 'pg' }),
 *   hooks: {
 *     '/register': {
 *       after: async (ctx) => {
 *         await sendWelcomeEmail(ctx.user.email)
 *       }
 *     }
 *   }
 * })
 */
export function bloomAuth(config: BloomAuthConfig): BloomAuth {
  /** Session cookie name used for storing session data */
  const cookieName = config.cookieName ?? 'bloom.sid'

  /** Event emitter for lifecycle hooks and plugin communication */
  const emitter = new EventEmitter()

  /** Router for registering and matching HTTP routes */
  const router = new Router()

  /** Set of paths that have hooks registered (for O(1) lookup) */
  const hookedPaths = new Set<string>()

  // Register hooks from config
  if (config.hooks) {
    for (const [path, handlers] of Object.entries(config.hooks)) {
      if (handlers.before) {
        emitter.on(`${path}:before`, handlers.before)
        hookedPaths.add(`${path}:before`)
      }
      if (handlers.after) {
        emitter.on(`${path}:after`, handlers.after)
        hookedPaths.add(`${path}:after`)
      }
    }
  }

  // Create rate limiter if config provided
  let rateLimiter: RateLimiter | undefined
  if (config.rateLimit) {
    // Validate rate limit config
    const validatedConfig = RateLimitConfigSchema.parse(config.rateLimit)
    rateLimiter = new RateLimiter({
      config: validatedConfig,
      storage: config.storage,
      adapter: config.adapter,
    })
  }

  /**
   * HTTP handler (Web Standard Request → Response)
   * Handles all auth routes including core endpoints and plugin routes
   */
  const handler = createHandler({
    router,
    emitter,
    hookedPaths,
    rateLimiter,
    basePath: '/auth',
  })

  // Register core routes
  router.register({
    path: '/session',
    method: 'GET',
    handler: async (ctx) => {
      const result = await getSessionFromContext(ctx)
      return Response.json(result, { status: 200 })
    },
  })

  // Only register email/password routes if config provided
  if (config.emailPassword) {
    router.register({
      path: '/register',
      method: 'POST',
      handler: async (ctx) => {
        return await register({
          ctx,
          adapter: config.adapter,
          emailPasswordConfig: config.emailPassword ?? {},
          sessionConfig: config.session ?? {},
          cookieName,
        })
      },
    })

    router.register({
      path: '/login',
      method: 'POST',
      handler: async (ctx) => {
        return await login({
          ctx,
          adapter: config.adapter,
          sessionConfig: config.session ?? {},
          cookieName,
        })
      },
    })
  }

  router.register({
    path: '/logout',
    method: 'POST',
    handler: async (ctx) => {
      return await logout({
        ctx,
        adapter: config.adapter,
        cookieName,
      })
    },
  })

  router.register({
    path: '/sessions',
    method: 'GET',
    handler: async (ctx) => {
      return await getSessions({
        ctx,
        adapter: config.adapter,
        cookieName,
      })
    },
  })

  router.register({
    path: '/sessions/:id',
    method: 'DELETE',
    handler: async (ctx) => {
      return await deleteSession({
        ctx,
        adapter: config.adapter,
        cookieName,
      })
    },
  })

  router.register({
    path: '/sessions',
    method: 'DELETE',
    handler: async (ctx) => {
      return await deleteAllSessions({
        ctx,
        adapter: config.adapter,
        cookieName,
      })
    },
  })

  // Email verification routes (only if email/password enabled)
  if (config.emailPassword) {
    router.register({
      path: '/send-verification-email',
      method: 'POST',
      handler: async (ctx) => {
        return await sendVerificationEmail({
          ctx,
          adapter: config.adapter,
        })
      },
    })

    router.register({
      path: '/verify-email',
      method: 'POST',
      handler: async (ctx) => {
        return await verifyEmail({
          ctx,
          adapter: config.adapter,
        })
      },
    })

    router.register({
      path: '/request-password-reset',
      method: 'POST',
      handler: async (ctx) => {
        return await requestPasswordReset({
          ctx,
          adapter: config.adapter,
        })
      },
    })

    router.register({
      path: '/reset-password',
      method: 'POST',
      handler: async (ctx) => {
        return await resetPassword({
          ctx,
          adapter: config.adapter,
          emailPasswordConfig: config.emailPassword ?? {},
        })
      },
    })
  }

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

    const session = await config.adapter.session.findById(sessionData.sessionId)
    if (!session || session.userId !== sessionData.userId) {
      return null
    }

    const user = await config.adapter.user.findById(session.userId)
    if (!user) {
      return null
    }

    await config.adapter.session.updateLastAccessed(session.id)
    return { user, session }
  }

  /**
   * BloomAuth instance
   *
   * Provides:
   * - handler: HTTP handler for all auth routes
   * - router: Register custom routes and plugins
   * - api: Direct API methods for server-side usage
   * - on/emit/off: Event system for lifecycle hooks
   */
  const auth: BloomAuth = {
    handler,
    router,

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
        const session = await config.adapter.session.findById(sessionData.sessionId)
        if (!session) {
          return null
        }

        // Verify session belongs to the user in the cookie
        if (session.userId !== sessionData.userId) {
          return null
        }

        // Load user from adapter
        const user = await config.adapter.user.findById(session.userId)
        if (!user) {
          return null
        }

        // Update last accessed time
        await config.adapter.session.updateLastAccessed(session.id)

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
