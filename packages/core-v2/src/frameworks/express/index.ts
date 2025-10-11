import type { BloomAuth } from '@/types'
import type { Request, Response, NextFunction } from 'express'

/**
 * Express framework adapter for Bloom Auth
 *
 * Converts Express req/res to Web Standard Request/Response
 * and calls Bloom's universal handler
 */

/**
 * Create Express middleware for Bloom Auth
 *
 * @example
 * import express from 'express'
 * import { auth } from './auth'
 * import { expressAdapter } from '@bloom/core-v2/frameworks/express'
 *
 * const app = express()
 * app.use('/auth/*', expressAdapter(auth))
 *
 * @example
 * // Or use with specific route
 * app.use('/api/auth', expressAdapter(auth))
 */
export function expressAdapter(auth: BloomAuth) {
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
      const response = await auth.handler(request)

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

/**
 * Create Express route handler (non-middleware version)
 *
 * Use this if you want to handle auth routes without middleware pattern
 *
 * @example
 * import express from 'express'
 * import { auth } from './auth'
 * import { expressHandler } from '@bloom/core-v2/frameworks/express'
 *
 * const app = express()
 * const handler = expressHandler(auth)
 *
 * app.all('/auth/*', handler)
 * app.get('/auth/session', handler)
 * app.post('/auth/login', handler)
 */
export function expressHandler(auth: BloomAuth) {
  return async (req: Request, res: Response) => {
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
      const response = await auth.handler(request)

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
      // Send 500 error
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
