import type { BloomAuth, ApiMethodParams, User, Session } from '@/types'
import type { DatabaseAdapter } from '@/storage/adapter'
import type { Storage, RateLimitConfig } from '@/schemas'
import type { Context } from '@/handler/context'
import { getCookie } from '@/utils/headers'
import { parseSessionCookie } from '@/utils/cookies'
import { ApiMethodParamsSchema, RateLimitConfigSchema } from '@/schemas'
import { Router } from '@/handler/router'
import { createHandler } from '@/handler/handler'
import { RateLimiter } from '@/rateLimit/limiter'
import {
  register,
  login,
  logout,
  getSession,
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
    before?: (ctx: Context) => Promise<void | Response>
    after?: (ctx: Context) => Promise<void | Response>
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

  /** Router for registering and matching HTTP routes */
  const router = new Router()

  /** Map storing hooks (path:before/path:after -> handler function) */
  type HookHandler = (ctx: Context) => Promise<void | Response>
  const hooks = new Map<string, HookHandler>()

  // Register hooks from config
  if (config.hooks) {
    for (const [path, handlers] of Object.entries(config.hooks)) {
      if (handlers.before) {
        hooks.set(`${path}:before`, handlers.before)
      }
      if (handlers.after) {
        hooks.set(`${path}:after`, handlers.after)
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
    hooks,
    rateLimiter,
    basePath: '/auth',
  })

  // Register core routes
  router.register({
    path: '/session',
    method: 'GET',
    handler: async (ctx) => {
      const cookieValue = ctx.headers.get('cookie')
        ? getCookie({ cookie: ctx.headers.get('cookie') }, cookieName)
        : null

      if (!cookieValue) {
        return Response.json(null, { status: 200 })
      }

      const sessionData = parseSessionCookie(cookieValue)
      if (!sessionData) {
        return Response.json(null, { status: 200 })
      }

      const session = await config.adapter.session.findById(sessionData.sessionId)
      if (!session || session.userId !== sessionData.userId) {
        return Response.json(null, { status: 200 })
      }

      const user = await config.adapter.user.findById(session.userId)
      if (!user) {
        return Response.json(null, { status: 200 })
      }

      await config.adapter.session.updateLastAccessed(session.id)
      return Response.json({ user, session }, { status: 200 })
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

  /**
   * BloomAuth instance
   *
   * Provides:
   * - handler: HTTP handler for all auth routes
   * - router: Register custom routes and plugins
   * - api: Direct API methods for server-side usage
   */
  const auth: BloomAuth = {
    handler,
    router,

    api: {
      async getSession(params: ApiMethodParams): Promise<{ user: User; session: Session } | null> {
        return await getSession({
          params,
          adapter: config.adapter,
          cookieName,
        })
      }
    }
  }

  return auth
}
