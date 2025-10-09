import { describe, it, expect } from 'vitest'
import { extractHeaders, getHeader, getCookie } from '@/utils/headers'

describe('Astro Headers', () => {
  it('should extract headers from Astro Request', () => {
    // Astro uses Web API Request which has Headers
    const request = new Request('https://example.com', {
      headers: {
        'content-type': 'text/html',
        'user-agent': 'Astro/5.14',
        'cookie': 'session=astro123',
      },
    })

    const headers = extractHeaders(request.headers)

    expect(headers.get('content-type')).toBe('text/html')
    expect(headers.get('user-agent')).toBe('Astro/5.14')
    expect(headers.get('cookie')).toBe('session=astro123')
  })

  it('should get single header from Astro request.headers', () => {
    const request = new Request('https://example.com', {
      headers: {
        'user-agent': 'Astro/SSR',
        'authorization': 'Bearer astro_token',
      },
    })

    expect(getHeader(request.headers, 'user-agent')).toBe('Astro/SSR')
    expect(getHeader(request.headers, 'authorization')).toBe('Bearer astro_token')
  })

  it('should handle case-insensitive header lookup', () => {
    const request = new Request('https://example.com', {
      headers: {
        'content-type': 'text/html',
      },
    })

    expect(getHeader(request.headers, 'Content-Type')).toBe('text/html')
    expect(getHeader(request.headers, 'CONTENT-TYPE')).toBe('text/html')
    expect(getHeader(request.headers, 'content-type')).toBe('text/html')
  })

  it('should parse cookies from Astro headers', () => {
    const request = new Request('https://example.com', {
      headers: {
        cookie: 'bloom.sid=astro_session; theme=dark',
      },
    })

    expect(getCookie(request.headers, 'bloom.sid')).toBe('astro_session')
    expect(getCookie(request.headers, 'theme')).toBe('dark')
  })

  it('should handle URL-encoded cookie values', () => {
    const request = new Request('https://example.com', {
      headers: {
        cookie: 'data=%7B%22astro%22%3A%22rocks%22%7D',
      },
    })

    expect(getCookie(request.headers, 'data')).toBe('{"astro":"rocks"}')
  })

  it('should handle missing headers', () => {
    const request = new Request('https://example.com', {
      headers: {
        'user-agent': 'Astro/5.14',
      },
    })

    expect(getHeader(request.headers, 'non-existent')).toBeNull()
    expect(getCookie(request.headers, 'session')).toBeNull()
  })

  it('should work with Astro.request pattern', () => {
    // Simulating Astro.request.headers
    const astroRequest = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cookie': 'bloom.sid=astro_post',
      },
      body: JSON.stringify({ data: 'test' }),
    })

    expect(getHeader(astroRequest.headers, 'content-type')).toBe('application/json')
    expect(getCookie(astroRequest.headers, 'bloom.sid')).toBe('astro_post')
  })

  it('should handle headers.entries() iteration', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-custom': 'value',
        'accept': 'text/html',
      },
    })

    const headers = extractHeaders(request.headers)

    // Should be able to iterate all headers
    expect(headers.size).toBeGreaterThan(0)
    expect(headers.get('x-custom')).toBe('value')
    expect(headers.get('accept')).toBe('text/html')
  })
})
