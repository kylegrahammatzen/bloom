import { describe, it, expect } from 'vitest'
import { extractHeaders, getHeader, getCookie } from '@/utils/headers'
import type { IncomingHttpHeaders } from 'http'

describe('Fastify Headers', () => {
  it('should extract headers from Fastify request.headers', () => {
    // Fastify request.headers is IncomingHttpHeaders (same as Express)
    const fastifyHeaders: IncomingHttpHeaders = {
      'content-type': 'application/json',
      'user-agent': 'Fastify/5.6',
      'cookie': 'session=fastify123',
    }

    const headers = extractHeaders(fastifyHeaders)

    expect(headers.get('content-type')).toBe('application/json')
    expect(headers.get('user-agent')).toBe('Fastify/5.6')
    expect(headers.get('cookie')).toBe('session=fastify123')
  })

  it('should get single header from Fastify request.headers', () => {
    const fastifyHeaders: IncomingHttpHeaders = {
      'user-agent': 'Fastify/Node',
      'authorization': 'Bearer fastify_token',
    }

    expect(getHeader(fastifyHeaders, 'user-agent')).toBe('Fastify/Node')
    expect(getHeader(fastifyHeaders, 'authorization')).toBe('Bearer fastify_token')
  })

  it('should handle case-insensitive header lookup', () => {
    const fastifyHeaders: IncomingHttpHeaders = {
      'content-type': 'application/json',
    }

    expect(getHeader(fastifyHeaders, 'Content-Type')).toBe('application/json')
    expect(getHeader(fastifyHeaders, 'CONTENT-TYPE')).toBe('application/json')
    expect(getHeader(fastifyHeaders, 'content-type')).toBe('application/json')
  })

  it('should parse cookies from Fastify headers', () => {
    const fastifyHeaders: IncomingHttpHeaders = {
      cookie: 'bloom.sid=fastify_session; lang=en',
    }

    expect(getCookie(fastifyHeaders, 'bloom.sid')).toBe('fastify_session')
    expect(getCookie(fastifyHeaders, 'lang')).toBe('en')
  })

  it('should handle URL-encoded cookie values', () => {
    const fastifyHeaders: IncomingHttpHeaders = {
      cookie: 'data=%7B%22fast%22%3A%22ify%22%7D',
    }

    expect(getCookie(fastifyHeaders, 'data')).toBe('{"fast":"ify"}')
  })

  it('should handle missing headers', () => {
    const fastifyHeaders: IncomingHttpHeaders = {
      'user-agent': 'Fastify/5.6',
    }

    expect(getHeader(fastifyHeaders, 'non-existent')).toBeNull()
    expect(getCookie(fastifyHeaders, 'session')).toBeNull()
  })

  it('should handle array header values from raw headers', () => {
    const fastifyHeaders: IncomingHttpHeaders = {
      'set-cookie': ['cookie1=value1', 'cookie2=value2'],
    }

    // Should take first value from array
    expect(getHeader(fastifyHeaders, 'set-cookie')).toBe('cookie1=value1')
  })

  it('should handle undefined header values', () => {
    const fastifyHeaders: IncomingHttpHeaders = {
      'user-agent': 'Fastify/5.6',
      'missing': undefined,
    }

    expect(getHeader(fastifyHeaders, 'missing')).toBeNull()

    const headers = extractHeaders(fastifyHeaders)
    expect(headers.has('missing')).toBe(false)
    expect(headers.has('user-agent')).toBe(true)
  })

  it('should handle custom headers with x- prefix', () => {
    const fastifyHeaders: IncomingHttpHeaders = {
      'x-request-id': 'fastify-req-123',
      'x-forwarded-for': '192.168.1.1',
    }

    expect(getHeader(fastifyHeaders, 'x-request-id')).toBe('fastify-req-123')
    expect(getHeader(fastifyHeaders, 'x-forwarded-for')).toBe('192.168.1.1')
  })
})
