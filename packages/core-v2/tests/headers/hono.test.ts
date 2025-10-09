import { describe, it, expect } from 'vitest'
import { extractHeaders, getHeader, getCookie } from '@/utils/headers'

describe('Hono Headers', () => {
  it('should extract headers from Hono Request', () => {
    // Hono uses Web API Request which has Headers
    const request = new Request('https://example.com', {
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Hono/4.9',
        'cookie': 'session=hono123',
      },
    })

    const headers = extractHeaders(request.headers)

    expect(headers.get('content-type')).toBe('application/json')
    expect(headers.get('user-agent')).toBe('Hono/4.9')
    expect(headers.get('cookie')).toBe('session=hono123')
  })

  it('should get single header from Hono Request.headers', () => {
    const request = new Request('https://example.com', {
      headers: {
        'user-agent': 'Hono/Web',
        'authorization': 'Bearer hono_token',
      },
    })

    expect(getHeader(request.headers, 'user-agent')).toBe('Hono/Web')
    expect(getHeader(request.headers, 'authorization')).toBe('Bearer hono_token')
  })

  it('should handle case-insensitive header lookup', () => {
    const request = new Request('https://example.com', {
      headers: {
        'content-type': 'application/json',
      },
    })

    expect(getHeader(request.headers, 'Content-Type')).toBe('application/json')
    expect(getHeader(request.headers, 'CONTENT-TYPE')).toBe('application/json')
    expect(getHeader(request.headers, 'content-type')).toBe('application/json')
  })

  it('should parse cookies from Hono headers', () => {
    const request = new Request('https://example.com', {
      headers: {
        cookie: 'bloom.sid=hono_session; theme=light',
      },
    })

    expect(getCookie(request.headers, 'bloom.sid')).toBe('hono_session')
    expect(getCookie(request.headers, 'theme')).toBe('light')
  })

  it('should handle URL-encoded cookie values', () => {
    const request = new Request('https://example.com', {
      headers: {
        cookie: 'data=%7B%22userId%22%3A%22hono123%22%7D',
      },
    })

    expect(getCookie(request.headers, 'data')).toBe('{"userId":"hono123"}')
  })

  it('should handle missing headers', () => {
    const request = new Request('https://example.com', {
      headers: {
        'user-agent': 'Hono/4.9',
      },
    })

    expect(getHeader(request.headers, 'non-existent')).toBeNull()
    expect(getCookie(request.headers, 'session')).toBeNull()
  })

  it('should work with plain Headers object', () => {
    // Simulating c.req.raw.headers access pattern
    const headers = new Headers({
      'content-type': 'application/json',
      'cookie': 'bloom.sid=hono_direct',
    })

    expect(getHeader(headers, 'content-type')).toBe('application/json')
    expect(getCookie(headers, 'bloom.sid')).toBe('hono_direct')
  })

  it('should handle lowercase header keys from Hono', () => {
    // Hono returns lowercase keys when calling c.req.header()
    const request = new Request('https://example.com', {
      headers: {
        'x-custom-header': 'custom-value',
        'authorization': 'Bearer token',
      },
    })

    expect(getHeader(request.headers, 'x-custom-header')).toBe('custom-value')
    expect(getHeader(request.headers, 'X-Custom-Header')).toBe('custom-value')
  })
})
