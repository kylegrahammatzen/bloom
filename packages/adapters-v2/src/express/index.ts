import type { BloomAuth } from '@bloom/core-v2'
import type { Request, Response, NextFunction } from 'express'

/**
 * Express framework adapter for Bloom Auth V2
 *
 * Converts Express req/res to Web Standard Request/Response format
 *
 * @example
 * import express from 'express'
 * import { auth } from './auth'
 * import { toExpressHandler } from '@bloom/adapters-v2/express'
 *
 * const app = express()
 * app.use(express.json())
 * app.use('/auth/*', toExpressHandler({ auth }))
 *
 * @example
 * // Direct API usage in Express routes
 * app.get('/dashboard', async (req, res) => {
 *   const session = await auth.api.getSession({ headers: req.headers })
 *   if (!session) return res.status(401).json({ error: 'Unauthorized' })
 *   res.json({ user: session.user })
 * })
 */
export function toExpressHandler(props: { auth: BloomAuth }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Build Web Standard Request from Express request
      const protocol = req.protocol || 'http'
      const host = req.get('host') || 'localhost'
      const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`)

      // Get body as string if it exists
      let body: string | undefined
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      }

      const request = new Request(url.toString(), {
        method: req.method,
        headers: new Headers(req.headers as Record<string, string>),
        body,
      })

      // Call Bloom handler
      const response = await props.auth.handler(request)

      // Convert Web Standard Response to Express response
      res.status(response.status)

      // Set headers
      response.headers.forEach((value, key) => {
        res.setHeader(key, value)
      })

      // Send body
      const responseBody = await response.text()

      // Try to parse as JSON for better Express integration
      try {
        const json = JSON.parse(responseBody)
        res.json(json)
      } catch {
        // Not JSON, send as text
        res.send(responseBody)
      }
    } catch (error) {
      // Pass error to Express error handler
      next(error)
    }
  }
}
