import type { BloomAuth } from '@/types'
import type { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js framework adapter for Bloom Auth
 *
 * Supports:
 * - App Router (Route Handlers with Web Standard Request/Response)
 * - Pages Router (API Routes with NextApiRequest/NextApiResponse)
 * - Server Actions (Direct API calls)
 */

/**
 * Create Next.js handlers for Bloom Auth
 *
 * @example
 * // app/api/auth/[...bloom]/route.ts (App Router)
 * import { auth } from '@/lib/auth'
 * import { nextAdapter } from '@bloom/core-v2/frameworks/next'
 *
 * const { GET, POST, DELETE } = nextAdapter(auth)
 * export { GET, POST, DELETE }
 *
 * @example
 * // pages/api/auth/[...bloom].ts (Pages Router)
 * import { auth } from '@/lib/auth'
 * import { nextAdapter } from '@bloom/core-v2/frameworks/next'
 *
 * export default nextAdapter(auth).handler
 */
export function nextAdapter(auth: BloomAuth) {
  /**
   * App Router handler (Route Handlers)
   * Uses Web Standard Request/Response
   */
  const appRouterHandler = async (request: Request) => {
    return await auth.handler(request)
  }

  /**
   * Pages Router handler (API Routes)
   * Converts NextApiRequest/NextApiResponse to Web Standard Request/Response
   */
  const pagesRouterHandler = async (req: any, res: any) => {
    // Build Web Standard Request from Next.js request
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers['x-forwarded-host'] || req.headers.host
    const url = new URL(req.url || '/', `${protocol}://${host}`)

    // Get body as string if it exists
    let body: string | undefined
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    }

    const request = new Request(url.toString(), {
      method: req.method || 'GET',
      headers: new Headers(req.headers as Record<string, string>),
      body,
    })

    // Call Bloom handler
    const response = await auth.handler(request)

    // Convert Web Standard Response to Next.js response
    res.status(response.status)

    // Set headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    // Send body
    const responseBody = await response.text()
    res.send(responseBody)
  }

  return {
    /**
     * App Router handlers - export these from your route.ts file
     * @example
     * export { GET, POST, DELETE } = nextAdapter(auth)
     */
    GET: appRouterHandler,
    POST: appRouterHandler,
    DELETE: appRouterHandler,
    PUT: appRouterHandler,
    PATCH: appRouterHandler,

    /**
     * Pages Router handler - export this as default from your [...bloom].ts file
     * @example
     * export default nextAdapter(auth).handler
     */
    handler: pagesRouterHandler,

    /**
     * Direct auth API access for Server Actions and Server Components
     * @example
     * const session = await nextAdapter(auth).api.getSession({ headers: await headers() })
     */
    api: auth.api,
  }
}
