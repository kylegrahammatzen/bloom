import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Router } from '@/handler/router'
import { createHandler } from '@/handler/handler'
import { bloomAuth } from '@/auth'
import type { Context } from '@/handler/context'
import { createMockAdapter } from '@/utils/mockAdapter'

type HookHandler = (ctx: Context) => Promise<void | Response>

describe('Router', () => {
  let router: Router

  beforeEach(() => {
    router = new Router()
  })

  it('should register and match exact routes', () => {
    const handler = vi.fn(async () => new Response('OK'))

    router.register({
      path: '/session',
      method: 'GET',
      handler,
    })

    const match = router.match('/session', 'GET')

    expect(match).not.toBeNull()
    expect(match?.handler).toBe(handler)
    expect(match?.params).toEqual({})
  })

  it('should return null for non-matching routes', () => {
    router.register({
      path: '/session',
      method: 'GET',
      handler: async () => new Response('OK'),
    })

    const match = router.match('/login', 'GET')

    expect(match).toBeNull()
  })

  it('should match routes with path parameters', () => {
    const handler = vi.fn(async () => new Response('OK'))

    router.register({
      path: '/sessions/:id',
      method: 'DELETE',
      handler,
    })

    const match = router.match('/sessions/abc123', 'DELETE')

    expect(match).not.toBeNull()
    expect(match?.handler).toBe(handler)
    expect(match?.params).toEqual({ id: 'abc123' })
  })

  it('should match wildcard routes', () => {
    const handler = vi.fn(async () => new Response('OK'))

    router.register({
      path: '/auth/*',
      method: 'GET',
      handler,
    })

    const match = router.match('/auth/anything/here', 'GET')

    expect(match).not.toBeNull()
    expect(match?.handler).toBe(handler)
  })

  it('should list all registered routes', () => {
    router.register({
      path: '/session',
      method: 'GET',
      handler: async () => new Response('OK'),
    })

    router.register({
      path: '/login',
      method: 'POST',
      handler: async () => new Response('OK'),
    })

    const routes = router.list()

    expect(routes).toHaveLength(2)
    expect(routes[0].path).toBe('/session')
    expect(routes[1].path).toBe('/login')
  })
})

describe('Handler', () => {
  let router: Router
  let hooks: Map<string, HookHandler>
  let handler: (request: Request) => Promise<Response>

  beforeEach(() => {
    router = new Router()
    hooks = new Map()
    handler = createHandler({ router, hooks, basePath: '/auth' })
  })

  it('should handle valid requests and return response', async () => {
    router.register({
      path: '/test',
      method: 'GET',
      handler: async () => {
        return new Response(JSON.stringify({ message: 'success' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })

    const request = new Request('http://localhost:3000/auth/test', {
      method: 'GET',
    })

    const response = await handler(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toEqual({ message: 'success' })
  })

  it('should return 404 for non-existent routes', async () => {
    const request = new Request('http://localhost:3000/auth/does-not-exist', {
      method: 'GET',
    })

    const response = await handler(request)

    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data).toEqual({ error: 'Not Found' })
  })

  it('should parse JSON body for POST requests', async () => {
    let capturedBody: any

    router.register({
      path: '/test',
      method: 'POST',
      handler: async (ctx: Context) => {
        capturedBody = ctx.body
        return new Response(JSON.stringify({ received: ctx.body }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })

    const request = new Request('http://localhost:3000/auth/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    })

    const response = await handler(request)

    expect(response.status).toBe(200)
    expect(capturedBody).toEqual({ email: 'test@example.com', password: 'password123' })
  })

  it('should extract query parameters', async () => {
    let capturedQuery: any

    router.register({
      path: '/test',
      method: 'GET',
      handler: async (ctx: Context) => {
        capturedQuery = ctx.query
        return new Response(JSON.stringify({ query: ctx.query }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })

    const request = new Request('http://localhost:3000/auth/test?foo=bar&baz=qux', {
      method: 'GET',
    })

    const response = await handler(request)

    expect(response.status).toBe(200)
    expect(capturedQuery).toEqual({ foo: 'bar', baz: 'qux' })
  })

  it('should extract path parameters', async () => {
    let capturedParams: any

    router.register({
      path: '/sessions/:id',
      method: 'DELETE',
      handler: async (ctx: Context) => {
        capturedParams = ctx.params
        return new Response(JSON.stringify({ deleted: ctx.params.id }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })

    const request = new Request('http://localhost:3000/auth/sessions/abc123', {
      method: 'DELETE',
    })

    const response = await handler(request)

    expect(response.status).toBe(200)
    expect(capturedParams).toEqual({ id: 'abc123' })
  })

  it('should execute hooks when registered for a path', async () => {
    const events: string[] = []

    // Register hooks for the /test path
    hooks.set('/test:before', async () => {
      events.push('before')
    })
    hooks.set('/test:after', async () => {
      events.push('after')
    })

    handler = createHandler({ router, hooks, basePath: '/auth' })

    router.register({
      path: '/test',
      method: 'GET',
      handler: async (ctx) => {
        // Handler manually calls hooks
        await ctx.hooks.before?.()
        events.push('handler')
        await ctx.hooks.after?.()
        return new Response('OK')
      },
    })

    const request = new Request('http://localhost:3000/auth/test', {
      method: 'GET',
    })

    await handler(request)

    expect(events).toEqual(['before', 'handler', 'after'])
  })

  it('should handle handler errors and return 500', async () => {
    router.register({
      path: '/error',
      method: 'GET',
      handler: async () => {
        throw new Error('Something went wrong')
      },
    })

    const request = new Request('http://localhost:3000/auth/error', {
      method: 'GET',
    })

    const response = await handler(request)

    expect(response.status).toBe(500)

    const data = (await response.json()) as { error: string; message: string }
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('Internal Server Error')
  })
})

describe('BloomAuth Integration', () => {
  it('should include handler and router in auth instance', () => {
    const adapter = createMockAdapter()
    const auth = bloomAuth({ adapter })

    expect(auth.handler).toBeDefined()
    expect(typeof auth.handler).toBe('function')
    expect(auth.router).toBeDefined()
    expect(auth.router.list).toBeDefined()
  })

  it('should have GET /session route registered', () => {
    const adapter = createMockAdapter()
    const auth = bloomAuth({ adapter })

    const routes = auth.router.list()
    const sessionRoute = routes.find((r) => r.path === '/session' && r.method === 'GET')

    expect(sessionRoute).toBeDefined()
  })

  it('should handle GET /auth/session request', async () => {
    const adapter = createMockAdapter()
    const auth = bloomAuth({ adapter })

    const request = new Request('http://localhost:3000/auth/session', {
      method: 'GET',
    })

    const response = await auth.handler(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toBeNull() // No session without cookie
  })
})
