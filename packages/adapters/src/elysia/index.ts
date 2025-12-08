import type { BloomAuth } from '@bloom/core'
import type { Elysia, Context as ElysiaContext } from 'elysia'

/**
 * Elysia framework adapter for Bloom Auth
 *
 * Elysia uses Web Standard Request/Response natively, so this is a thin wrapper
 *
 * @example
 * import { Elysia } from 'elysia'
 * import { auth } from './lib/auth'
 * import { toElysiaHandler, bloomPlugin } from '@bloom/adapters/elysia'
 *
 * // Option 1: Use as route handler
 * const app = new Elysia()
 *   .all('/auth/*', toElysiaHandler({ auth }))
 *   .listen(5004)
 *
 * // Option 2: Use as Elysia plugin
 * const app = new Elysia()
 *   .use(bloomPlugin({ auth, prefix: '/auth' }))
 *   .listen(5004)
 */
export function toElysiaHandler(props: { auth: BloomAuth }) {
  return async (context: ElysiaContext): Promise<Response> => {
    return await props.auth.handler(context.request)
  }
}

/**
 * Elysia plugin for cleaner integration
 * Registers all auth routes under the specified prefix
 */
export function bloomPlugin(props: { auth: BloomAuth; prefix?: string }) {
  const prefix = props.prefix ?? '/auth'

  return (app: Elysia) => {
    return app.all(`${prefix}/*`, async (context: ElysiaContext) => {
      return await props.auth.handler(context.request)
    })
  }
}
