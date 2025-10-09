import { describe, it, expect } from 'vitest'
import { extractHeaders, getHeader, getCookie } from '@/utils/headers'

describe('Elysia Headers', () => {
  it('should extract headers from Elysia context.headers', () => {
    // Elysia context.headers is a plain object
    const elysiaHeaders = {
      'content-type': 'application/json',
      'user-agent': 'Elysia/1.4',
      'cookie': 'session=elysia123',
    }

    const headers = extractHeaders(elysiaHeaders)

    expect(headers.get('content-type')).toBe('application/json')
    expect(headers.get('user-agent')).toBe('Elysia/1.4')
    expect(headers.get('cookie')).toBe('session=elysia123')
  })

  it('should get single header from Elysia context.headers', () => {
    const elysiaHeaders = {
      'user-agent': 'Elysia/Bun',
      'authorization': 'Bearer elysia_token',
    }

    expect(getHeader(elysiaHeaders, 'user-agent')).toBe('Elysia/Bun')
    expect(getHeader(elysiaHeaders, 'authorization')).toBe('Bearer elysia_token')
  })

  it('should handle case-insensitive header lookup', () => {
    const elysiaHeaders = {
      'content-type': 'application/json',
    }

    expect(getHeader(elysiaHeaders, 'Content-Type')).toBe('application/json')
    expect(getHeader(elysiaHeaders, 'CONTENT-TYPE')).toBe('application/json')
    expect(getHeader(elysiaHeaders, 'content-type')).toBe('application/json')
  })

  it('should parse cookies from Elysia headers', () => {
    const elysiaHeaders = {
      cookie: 'bloom.sid=elysia_session; user_pref=dark',
    }

    expect(getCookie(elysiaHeaders, 'bloom.sid')).toBe('elysia_session')
    expect(getCookie(elysiaHeaders, 'user_pref')).toBe('dark')
  })

  it('should handle URL-encoded cookie values', () => {
    const elysiaHeaders = {
      cookie: 'data=%7B%22token%22%3A%22abc123%22%7D',
    }

    expect(getCookie(elysiaHeaders, 'data')).toBe('{"token":"abc123"}')
  })

  it('should handle missing headers', () => {
    const elysiaHeaders = {
      'user-agent': 'Elysia/Bun',
    }

    expect(getHeader(elysiaHeaders, 'non-existent')).toBeNull()
    expect(getCookie(elysiaHeaders, 'session')).toBeNull()
  })

  it('should handle derive pattern with bearer token extraction', () => {
    const elysiaHeaders = {
      'authorization': 'Bearer my_token_123',
    }

    const auth = getHeader(elysiaHeaders, 'authorization')
    const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null

    expect(bearer).toBe('my_token_123')
  })

  it('should handle lowercase headers from Elysia validation', () => {
    // Elysia parses headers as lowercase keys only
    const elysiaHeaders = {
      'authorization': 'Bearer token',
      'x-custom-header': 'custom-value',
    }

    expect(getHeader(elysiaHeaders, 'authorization')).toBe('Bearer token')
    expect(getHeader(elysiaHeaders, 'x-custom-header')).toBe('custom-value')
  })
})
