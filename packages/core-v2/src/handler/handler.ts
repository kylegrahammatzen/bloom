import type { Router } from '@/handler/router'
import type { Context } from '@/handler/context'
import type { EventEmitter } from '@/events/emitter'
import { buildContext } from '@/handler/context'

export type HandlerConfig = {
  router: Router
  emitter: EventEmitter
  basePath?: string
}

/**
 * Create the universal HTTP handler
 * Takes Web Standard Request, returns Web Standard Response
 */
export function createHandler(config: HandlerConfig) {
  const { router, emitter, basePath = '/auth' } = config

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url)
    const fullPath = url.pathname
    const method = request.method

    // Emit request start event
    await emitter.emit('request:start', { path: fullPath, method })

    // Strip base path if present
    const path = fullPath.startsWith(basePath)
      ? fullPath.slice(basePath.length) || '/'
      : fullPath

    // Build base context
    const baseContext = await buildContext(request)

    // Match route
    const match = router.match(path, method)

    if (!match) {
      await emitter.emit('request:notfound', { path: fullPath, method })

      return new Response(
        JSON.stringify({ error: 'Not Found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Build full context with params
    const ctx: Context = {
      ...baseContext,
      path,
      params: match.params,
      user: null,
      session: null,
    }

    try {
      // Emit before endpoint event
      await emitter.emit('endpoint:before', { path, method, params: match.params })

      // Execute route handler
      const response = await match.handler(ctx)

      // Emit after endpoint event
      await emitter.emit('endpoint:after', { path, method, status: response.status })

      // Emit request end event
      await emitter.emit('request:end', { path: fullPath, method, status: response.status })

      return response
    } catch (error) {
      // Emit error event
      await emitter.emit('request:error', {
        path: fullPath,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      console.error(`Handler error for ${method} ${fullPath}:`, error)

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }
}
