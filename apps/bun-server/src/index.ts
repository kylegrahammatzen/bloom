import { auth } from './lib/auth'

const PORT = Number(process.env.PORT) || 5003
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'

const server = Bun.serve({
  port: PORT,
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': CORS_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      })
    }

    // Route to Bloom Auth handler
    if (url.pathname.startsWith('/auth/')) {
      const response = await auth.handler(request)

      // Add CORS headers to response
      const headers = new Headers(response.headers)
      headers.set('Access-Control-Allow-Origin', CORS_ORIGIN)
      headers.set('Access-Control-Allow-Credentials', 'true')

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    }

    // 404 for other routes
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  },
})

console.log(`[Server] Running on http://localhost:${server.port}`)
console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
