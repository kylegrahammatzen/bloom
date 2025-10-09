import { describe, it, expect } from 'vitest'
import { extractHeaders, getHeader, getCookie } from '@/utils/headers'

/**
 * Test SvelteKit headers handling
 * SvelteKit uses standard Web API Request, which has Headers
 * event.request.headers is a Headers object
 */
describe('SvelteKit Headers', () => {
  it('should extract headers from Web API Headers', () => {
    const headers = new Headers({
      'user-agent': 'Mozilla/5.0',
      'cookie': 'bloom.sid=abc123',
      'content-type': 'application/json',
    })

    const extracted = extractHeaders(headers)
    expect(extracted.get('user-agent')).toBe('Mozilla/5.0')
    expect(extracted.get('cookie')).toBe('bloom.sid=abc123')
    expect(extracted.get('content-type')).toBe('application/json')
  })

  it('should get single header from Headers', () => {
    const headers = new Headers({
      'user-agent': 'SvelteKit/1.0',
      'accept': 'text/html',
    })

    expect(getHeader(headers, 'user-agent')).toBe('SvelteKit/1.0')
    expect(getHeader(headers, 'accept')).toBe('text/html')
    expect(getHeader(headers, 'missing')).toBeNull()
  })

  it('should extract cookie from Headers', () => {
    const headers = new Headers({
      'cookie': 'bloom.sid=xyz789; session_data=encrypted',
    })

    expect(getCookie(headers, 'bloom.sid')).toBe('xyz789')
    expect(getCookie(headers, 'session_data')).toBe('encrypted')
  })

  it('should work with RequestEvent pattern', () => {
    // Simulating SvelteKit's RequestEvent.request.headers
    const request = new Request('https://example.com', {
      headers: {
        'user-agent': 'SvelteKit Test',
        'cookie': 'bloom.sid=test123',
      },
    })

    const headers = request.headers
    expect(getHeader(headers, 'user-agent')).toBe('SvelteKit Test')
    expect(getCookie(headers, 'bloom.sid')).toBe('test123')
  })

  it('should handle headers.entries() iteration', () => {
    const headers = new Headers({
      'x-custom': 'value1',
      'x-another': 'value2',
    })

    const extracted = extractHeaders(headers)
    expect(extracted.size).toBe(2)
    expect(extracted.get('x-custom')).toBe('value1')
    expect(extracted.get('x-another')).toBe('value2')
  })

  it('should handle headers.get() method', () => {
    const headers = new Headers({
      'authorization': 'Bearer token123',
    })

    expect(getHeader(headers, 'authorization')).toBe('Bearer token123')
    expect(getHeader(headers, 'Authorization')).toBe('Bearer token123') // case-insensitive
  })
})
