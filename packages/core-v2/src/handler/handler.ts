import type { Router } from '@/handler/router'
import type { Context } from '@/handler/context'
import type { RateLimiter } from '@/rateLimit/limiter'
import { buildContext } from '@/handler/context'

type HookHandler = (ctx: Context) => Promise<void | Response>

export type HandlerConfig = {
  router: Router
  hooks: Map<string, HookHandler>
  rateLimiter?: RateLimiter
  basePath?: string
}

/**
 * Create the universal HTTP handler
 * Takes Web Standard Request, returns Web Standard Response
 */
export function createHandler(config: HandlerConfig) {
  const { router, hooks, rateLimiter, basePath = '/auth' } = config

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url)
    const fullPath = url.pathname
    const method = request.method
    const path = fullPath.startsWith(basePath) ? fullPath.slice(basePath.length) || '/' : fullPath

    const baseContext = await buildContext(request)

    // Rate limiting happens before route matching and authentication
    const rateLimitContext: Context = {
      ...baseContext,
      path,
      params: {},
      user: null,
      session: null,
      hooks: {},
    }

    if (rateLimiter) {
      const rateLimitResult = await rateLimiter.check(rateLimitContext)

      if (!rateLimitResult.allowed) {
        return Response.json(
          {
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(rateLimitResult.limit),
              'X-RateLimit-Remaining': String(rateLimitResult.remaining),
              'X-Retry-After': String(rateLimitResult.retryAfter),
            },
          }
        )
      }
    }

    const match = router.match(path, method)
    if (!match) {
      return Response.json({ error: 'Not Found' }, { status: 404 })
    }

    const ctx: Context = {
      ...baseContext,
      path,
      params: match.params,
      user: null,
      session: null,
      hooks: {
        before: hooks.has(`${path}:before`)
          ? async () => {
              const handler = hooks.get(`${path}:before`)
              if (handler) await handler(ctx)
            }
          : undefined,
        after: hooks.has(`${path}:after`)
          ? async () => {
              const handler = hooks.get(`${path}:after`)
              if (handler) await handler(ctx)
            }
          : undefined,
      },
    }

    try {
      return await match.handler(ctx)
    } catch (error) {
      console.error(`Handler error for ${method} ${fullPath}:`, error)
      return Response.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  }
}
