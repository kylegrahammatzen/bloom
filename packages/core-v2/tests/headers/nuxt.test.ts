import { describe, it, expect } from 'vitest'
import { extractHeaders, getHeader, getCookie } from '@/utils/headers'

/**
 * Test Nuxt/H3 headers handling
 * Nuxt uses H3, which provides headers as plain objects
 * Headers can be strings or string arrays
 */
describe('Nuxt/H3 Headers', () => {
  it('should extract headers from plain object', () => {
    const headers = {
      'user-agent': 'Mozilla/5.0',
      'cookie': 'bloom.sid=abc123',
      'accept': 'application/json',
    }

    const extracted = extractHeaders(headers)
    expect(extracted.get('user-agent')).toBe('Mozilla/5.0')
    expect(extracted.get('cookie')).toBe('bloom.sid=abc123')
    expect(extracted.get('accept')).toBe('application/json')
  })

  it('should handle array values (multiple headers)', () => {
    const headers = {
      'user-agent': ['Mozilla/5.0', 'Chrome/91.0'],
      'cookie': 'bloom.sid=abc123',
    }

    // Should use first value from array
    expect(getHeader(headers, 'user-agent')).toBe('Mozilla/5.0')
    expect(getHeader(headers, 'cookie')).toBe('bloom.sid=abc123')
  })

  it('should extract cookie from plain object headers', () => {
    const headers = {
      'cookie': 'bloom.sid=abc123; other=value',
    }

    expect(getCookie(headers, 'bloom.sid')).toBe('abc123')
    expect(getCookie(headers, 'other')).toBe('value')
  })

  it('should handle empty object', () => {
    const headers = {}

    expect(extractHeaders(headers).size).toBe(0)
    expect(getHeader(headers, 'user-agent')).toBeNull()
    expect(getCookie(headers, 'session')).toBeNull()
  })

  it('should handle mixed case headers', () => {
    const headers = {
      'Content-Type': 'application/json',
      'USER-AGENT': 'test',
    }

    const extracted = extractHeaders(headers)
    // Should be normalized to lowercase
    expect(extracted.get('content-type')).toBe('application/json')
    expect(extracted.get('user-agent')).toBe('test')
  })

  it('should handle typical H3Event.headers shape', () => {
    // Simulating typical H3Event headers
    const headers = {
      host: 'localhost:3000',
      connection: 'keep-alive',
      'user-agent': 'Mozilla/5.0',
      accept: '*/*',
      'accept-encoding': 'gzip, deflate',
      cookie: 'bloom.sid=xyz789; theme=dark',
    }

    expect(getHeader(headers, 'host')).toBe('localhost:3000')
    expect(getHeader(headers, 'user-agent')).toBe('Mozilla/5.0')
    expect(getCookie(headers, 'bloom.sid')).toBe('xyz789')
    expect(getCookie(headers, 'theme')).toBe('dark')
  })
})
