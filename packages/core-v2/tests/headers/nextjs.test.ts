import { describe, it, expect } from 'vitest'
import { extractHeaders, getHeader, getCookie } from '@/utils/headers'

/**
 * Test Next.js headers handling
 * Next.js 15+ returns ReadonlyHeaders from await headers()
 */
describe('Next.js Headers', () => {
  it('should extract headers from Headers object', () => {
    // Next.js uses standard Headers Web API under the hood
    const headers = new Headers({
      'user-agent': 'Mozilla/5.0',
      'cookie': 'bloom.sid=abc123',
    })

    const extracted = extractHeaders(headers)
    expect(extracted.get('user-agent')).toBe('Mozilla/5.0')
    expect(extracted.get('cookie')).toBe('bloom.sid=abc123')
  })

  it('should get single header from Headers object', () => {
    const headers = new Headers({
      'user-agent': 'Mozilla/5.0',
      'accept': 'application/json',
    })

    expect(getHeader(headers, 'user-agent')).toBe('Mozilla/5.0')
    expect(getHeader(headers, 'accept')).toBe('application/json')
    expect(getHeader(headers, 'missing')).toBeNull()
  })

  it('should extract cookie from Headers object', () => {
    const headers = new Headers({
      'cookie': 'bloom.sid=abc123; other=value; third=data',
    })

    expect(getCookie(headers, 'bloom.sid')).toBe('abc123')
    expect(getCookie(headers, 'other')).toBe('value')
    expect(getCookie(headers, 'third')).toBe('data')
    expect(getCookie(headers, 'missing')).toBeNull()
  })

  it('should handle empty headers', () => {
    const headers = new Headers()

    expect(extractHeaders(headers).size).toBe(0)
    expect(getHeader(headers, 'user-agent')).toBeNull()
    expect(getCookie(headers, 'session')).toBeNull()
  })

  it('should handle case-insensitive header names', () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'user-AGENT': 'test',
    })

    const extracted = extractHeaders(headers)
    expect(extracted.get('content-type')).toBe('application/json')
    expect(extracted.get('user-agent')).toBe('test')
  })

  it('should handle URL-encoded cookie values', () => {
    const headers = new Headers({
      'cookie': 'bloom.sid=' + encodeURIComponent('special:value/with+chars'),
    })

    expect(getCookie(headers, 'bloom.sid')).toBe('special:value/with+chars')
  })
})
