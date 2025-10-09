<img src="../../../../../.github/banner.png" width="100%" alt="Bloom Banner" />

# Bloom Core V2 - Headers

Framework-agnostic header utilities for Bloom Core v2.

## Overview

Work with HTTP headers across frameworks without manual cookie parsing or header extraction.

## Frameworks

| Framework | Type |
|-----------|------|
| [Next.js 15+](#nextjs-15) | ReadonlyHeaders |
| [Express / Fastify](#express--fastify) | IncomingHttpHeaders |
| [Nuxt 4 / H3 / Elysia](#nuxt-4--h3--elysia) | Plain Object |
| [SvelteKit 2 / Hono / Astro](#sveltekit-2--hono--astro) | Web API Headers |

---

## API Reference

### `getHeader()`

Get a single header value with case-insensitive lookup.

**Signature:**
```typescript
function getHeader(input: RequestHeaders, name: string): string | null
```

**Parameters:**
- `input` - Headers from any framework
- `name` - Header name (case-insensitive)

**Returns:** Header value or `null` if not found

---

### `getCookie()`

Get a single cookie value from the Cookie header with automatic URL decoding.

**Signature:**
```typescript
function getCookie(input: RequestHeaders, name: string): string | null
```

**Parameters:**
- `input` - Headers from any framework
- `name` - Cookie name

**Returns:** Cookie value (URL-decoded) or `null` if not found

**Performance:** Uses early-return optimization for better performance when searching through multiple cookies.

---

### `getAllCookies()`

Get all cookies from the Cookie header as a Record. More efficient than multiple `getCookie()` calls.

**Signature:**
```typescript
function getAllCookies(input: RequestHeaders): Record<string, string>
```

**Parameters:**
- `input` - Headers from any framework

**Returns:** Record of all cookie key-value pairs (URL-decoded)

**Performance:** Single parse of the Cookie header, more efficient when you need multiple cookies.

---

### `extractHeaders()`

Extract all headers into a normalized `Map<string, string>` with lowercase keys.

**Signature:**
```typescript
function extractHeaders(input: RequestHeaders): Map<string, string>
```

**Parameters:**
- `input` - Headers from any framework

**Returns:** Map with lowercase header names as keys

**Note:** Cannot enumerate generic interfaces. Use specific framework types (Headers, ReadonlyHeaders, or plain objects).

---

## Framework Examples

### Next.js 15

```typescript
import { headers } from 'next/headers'
import { getHeader, getCookie, getAllCookies, extractHeaders } from '@bloom/core-v2'

// Get single header
export async function GET() {
  const userAgent = getHeader(await headers(), 'user-agent')
  const contentType = getHeader(await headers(), 'Content-Type')

  return Response.json({ userAgent, contentType })
}

// Get single cookie
export async function GET() {
  const sessionId = getCookie(await headers(), 'bloom.sid')

  if (!sessionId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  return Response.json({ sessionId })
}

// Get all cookies
export async function GET() {
  const cookies = getAllCookies(await headers())
  const { 'bloom.sid': sessionId, theme, lang } = cookies

  return Response.json({ sessionId, theme, lang })
}

// Extract all headers
export async function GET() {
  const allHeaders = extractHeaders(await headers())

  for (const [key, value] of allHeaders.entries()) {
    console.log(`${key}: ${value}`)
  }

  const userAgent = allHeaders.get('user-agent')
  const host = allHeaders.get('host')

  return Response.json({ userAgent, host })
}
```

---

### Express / Fastify

```typescript
import express from 'express'
// or: import Fastify from 'fastify'
import { getHeader, getCookie, getAllCookies, extractHeaders } from '@bloom/core-v2'

const app = express()
// or: const fastify = Fastify()

// Get single header
app.get('/api', (req, res) => {
  const auth = getHeader(req.headers, 'authorization')
  const host = getHeader(req.headers, 'host')

  res.json({ auth, host })
})
// Fastify: fastify.get('/api', (request, reply) => { ... })

// Get single cookie
app.get('/api/session', (req, res) => {
  const token = getCookie(req.headers, 'auth_token')

  res.json({ token })
})
// Fastify: fastify.get('/session', (request, reply) => { ... })

// Get all cookies
app.get('/api/preferences', (req, res) => {
  const cookies = getAllCookies(req.headers)

  res.json({
    theme: cookies.theme,
    lang: cookies.lang,
    timezone: cookies.timezone,
  })
})
// Fastify: fastify.get('/cookies', (request, reply) => { ... })

// Extract all headers
app.get('/api/debug', (req, res) => {
  const allHeaders = extractHeaders(req.headers)
  const headersObj = Object.fromEntries(allHeaders)

  res.json({ headers: headersObj })
})
// Fastify: fastify.get('/headers', (request, reply) => { ... })
```

---

### Nuxt 4 / H3 / Elysia

```typescript
// Nuxt/H3
import { getHeader, getCookie, getAllCookies, extractHeaders } from '@bloom/core-v2'

export default defineEventHandler((event) => {
  // Get single header
  const referer = getHeader(event.headers, 'referer')
  const accept = getHeader(event.headers, 'accept')

  // Get single cookie
  const sessionId = getCookie(event.headers, 'bloom.sid')

  // Get all cookies
  const cookies = getAllCookies(event.headers)

  // Extract all headers
  const headers = extractHeaders(event.headers)

  return {
    referer,
    sessionId,
    theme: cookies.theme,
    allHeaders: Object.fromEntries(headers),
  }
})
```

```typescript
// Elysia
import { Elysia } from 'elysia'
import { getHeader, getCookie, getAllCookies, extractHeaders } from '@bloom/core-v2'

new Elysia()
  .get('/api', ({ headers }) => {
    // Get single header
    const userAgent = getHeader(headers, 'user-agent')

    // Get single cookie
    const sessionId = getCookie(headers, 'bloom.sid')

    // Get all cookies
    const cookies = getAllCookies(headers)

    // Extract all headers
    const allHeaders = extractHeaders(headers)

    return {
      userAgent,
      sessionId,
      cookies,
      allHeaders: Object.fromEntries(allHeaders),
    }
  })
```

---

### SvelteKit 2 / Hono / Astro

```typescript
// SvelteKit
import { getHeader, getCookie, getAllCookies, extractHeaders } from '@bloom/core-v2'

export async function load({ request }) {
  // Get single header
  const origin = getHeader(request.headers, 'origin')

  // Get single cookie
  const theme = getCookie(request.headers, 'theme')
  const lang = getCookie(request.headers, 'lang')

  // Get all cookies
  const cookies = getAllCookies(request.headers)

  // Extract all headers
  const headers = extractHeaders(request.headers)

  return {
    origin,
    session: cookies['bloom.sid'],
    preferences: {
      theme: cookies.theme || 'light',
      lang: cookies.lang || 'en',
    },
    headers: Object.fromEntries(headers),
  }
}
```

```typescript
// Hono
import { Hono } from 'hono'
import { getHeader, getCookie, getAllCookies, extractHeaders } from '@bloom/core-v2'

const app = new Hono()

app.get('/api', (c) => {
  // Get single header
  const contentType = getHeader(c.req.raw.headers, 'content-type')

  // Get single cookie
  const userId = getCookie(c.req.raw.headers, 'user_id')

  // Get all cookies
  const cookies = getAllCookies(c.req.raw.headers)

  // Extract all headers
  const headers = extractHeaders(c.req.raw.headers)

  return c.json({
    contentType,
    userId,
    cookies,
    headers: Object.fromEntries(headers),
  })
})
```

```typescript
// Astro
import { getHeader, getCookie, getAllCookies, extractHeaders } from '@bloom/core-v2'

export async function GET({ request }) {
  // Get single header
  const userAgent = getHeader(request.headers, 'user-agent')

  // Get single cookie
  const theme = getCookie(request.headers, 'theme')

  // Get all cookies
  const cookies = getAllCookies(request.headers)

  // Extract all headers
  const headers = extractHeaders(request.headers)

  return new Response(JSON.stringify({
    userAgent,
    theme,
    cookies,
    headers: Object.fromEntries(headers),
  }))
}
```

---

## Notes

### Case Sensitivity

All header operations are case-insensitive. Internal storage uses lowercase keys:

```typescript
getHeader(headers, 'Content-Type') === getHeader(headers, 'content-type') // true
```

### Error Handling

- `getHeader()` returns `null` if header not found
- `getCookie()` returns `null` if cookie not found or Cookie header missing
- `getAllCookies()` returns `{}` if Cookie header missing
- `extractHeaders()` throws error if trying to enumerate generic interface

### Performance

- `getCookie()` uses early-return optimization (stops searching after finding the cookie)
- `getAllCookies()` is more efficient than multiple `getCookie()` calls when you need multiple cookies
- `getHeader()` checks lowercase first (more common), falls back to original casing
- All cookie values are URL-decoded with fallback to raw value if decoding fails

## License

This project is licensed under the GNU Affero General Public License v3.0.
