import type { BloomAuth } from '@bloom/core-v2'

/**
 * Next.js framework adapter for Bloom Auth V2
 *
 * Converts Next.js requests to Web Standard Request/Response format
 *
 * @example
 * // app/api/auth/[...bloom]/route.ts (App Router)
 * import { auth } from '@/lib/auth'
 * import { toNextJsHandler } from '@bloom/adapters-v2/next'
 *
 * export const { GET, POST, DELETE, OPTIONS } = toNextJsHandler({ auth })
 *
 * @example
 * // Server Actions - use auth.api directly
 * import { auth } from '@/lib/auth'
 * import { headers } from 'next/headers'
 *
 * const session = await auth.api.getSession({ headers: await headers() })
 */
export function toNextJsHandler(props: { auth: BloomAuth }) {
  /**
   * Universal handler for all HTTP methods
   * Uses Web Standard Request/Response
   */
  const handler = async (request: Request) => {
    return await props.auth.handler(request)
  }

  return {
    GET: handler,
    POST: handler,
    DELETE: handler,
    PUT: handler,
    PATCH: handler,
    OPTIONS: handler,
  }
}
