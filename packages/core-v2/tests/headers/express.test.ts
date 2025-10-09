import { describe, it, expect } from 'vitest'
import { extractHeaders, getHeader, getCookie } from '@/utils/headers'
import type { IncomingHttpHeaders } from 'http'

describe('Express Headers', () => {
  it('should extract headers from Express req.headers', () => {
    const expressHeaders: IncomingHttpHeaders = {
      'content-type': 'application/json',
      'user-agent': 'Express/Test',
      'cookie': 'session=abc123',
    }

    const headers = extractHeaders(expressHeaders)

    expect(headers.get('content-type')).toBe('application/json')
    expect(headers.get('user-agent')).toBe('Express/Test')
    expect(headers.get('cookie')).toBe('session=abc123')
  })

  it('should get single header from Express req.headers', () => {
    const expressHeaders: IncomingHttpHeaders = {
      'user-agent': 'Express/Test',
      'authorization': 'Bearer token123',
    }

    expect(getHeader(expressHeaders, 'user-agent')).toBe('Express/Test')
    expect(getHeader(expressHeaders, 'authorization')).toBe('Bearer token123')
  })

  it('should handle case-insensitive header lookup', () => {
    const expressHeaders: IncomingHttpHeaders = {
      'content-type': 'application/json',
    }

    expect(getHeader(expressHeaders, 'Content-Type')).toBe('application/json')
    expect(getHeader(expressHeaders, 'CONTENT-TYPE')).toBe('application/json')
    expect(getHeader(expressHeaders, 'content-type')).toBe('application/json')
  })

  it('should parse cookies from Express headers', () => {
    const expressHeaders: IncomingHttpHeaders = {
      cookie: 'bloom.sid=session123; user_id=456',
    }

    expect(getCookie(expressHeaders, 'bloom.sid')).toBe('session123')
    expect(getCookie(expressHeaders, 'user_id')).toBe('456')
  })

  it('should handle URL-encoded cookie values', () => {
    const expressHeaders: IncomingHttpHeaders = {
      cookie: 'data=%7B%22userId%22%3A%22123%22%7D',
    }

    expect(getCookie(expressHeaders, 'data')).toBe('{"userId":"123"}')
  })

  it('should handle missing headers', () => {
    const expressHeaders: IncomingHttpHeaders = {
      'user-agent': 'Express/Test',
    }

    expect(getHeader(expressHeaders, 'non-existent')).toBeNull()
    expect(getCookie(expressHeaders, 'session')).toBeNull()
  })

  it('should handle array header values', () => {
    const expressHeaders: IncomingHttpHeaders = {
      'set-cookie': ['cookie1=value1', 'cookie2=value2'],
    }

    // Should take first value from array
    expect(getHeader(expressHeaders, 'set-cookie')).toBe('cookie1=value1')
  })

  it('should handle undefined header values', () => {
    const expressHeaders: IncomingHttpHeaders = {
      'user-agent': 'Express/Test',
      'missing': undefined,
    }

    expect(getHeader(expressHeaders, 'missing')).toBeNull()

    const headers = extractHeaders(expressHeaders)
    expect(headers.has('missing')).toBe(false)
    expect(headers.has('user-agent')).toBe(true)
  })
})
