/**
 * Framework-agnostic headers abstraction for Bloom Core v2
 *
 * Supports headers from:
 * - Next.js (ReadonlyHeaders from next/headers)
 * - Nuxt/H3 (plain object)
 * - SvelteKit (Web API Headers)
 * - Express (req.headers)
 * - Hono (Context headers)
 * - Astro (Request headers)
 */

/**
 * ReadonlyHeaders type (from Next.js)
 * Re-exported for convenience
 */
export interface ReadonlyHeaders {
  entries(): IterableIterator<[string, string]>
  get(name: string): string | null
  has(name: string): boolean
  keys(): IterableIterator<string>
  values(): IterableIterator<string>
  [Symbol.iterator](): IterableIterator<[string, string]>
}

/**
 * Union type for all supported header inputs from HTTP requests
 */
export type RequestHeaders =
  | Headers
  | ReadonlyHeaders
  | Record<string, string | string[] | undefined>
  | Map<string, string>
  | { get(name: string): string | null; has(name: string): boolean }

/**
 * Get a single header value (case-insensitive)
 *
 * @param input - Headers from any framework
 * @param name - Header name (case-insensitive)
 * @returns Header value or null
 *
 * @example
 * const userAgent = getHeader(await headers(), 'user-agent')
 * const auth = getHeader(req.headers, 'authorization')
 *
 * @see {@link ./headers.md} for framework-specific examples
 */
export function getHeader(input: RequestHeaders, name: string): string | null {
  // Web API Headers or ReadonlyHeaders
  if (hasGet(input)) {
    return input.get(name)
  }

  // Plain object or H3/Express headers
  if (input && typeof input === 'object' && !hasEntries(input)) {
    const obj = input as Record<string, string | string[] | undefined>
    const normalized = name.toLowerCase()

    // Check lowercase first (more common in most frameworks)
    let value = obj[normalized]
    if (!value && normalized !== name) {
      // Fallback to original casing if lowercase not found
      value = obj[name]
    }

    if (!value) return null
    if (Array.isArray(value)) return value[0] || null
    return value
  }

  // Map
  if (input instanceof Map) {
    return input.get(name.toLowerCase()) || null
  }

  return null
}

/**
 * Get cookie header value and parse a specific cookie
 * Automatically URL-decodes the value. Returns early for better performance.
 *
 * @param input - Headers from any framework
 * @param name - Cookie name
 * @returns Cookie value (URL-decoded) or null
 *
 * @example
 * const sessionId = getCookie(await headers(), 'bloom.sid')
 * const theme = getCookie(request.headers, 'theme')
 *
 * @see {@link ./headers.md} for framework-specific examples
 */
export function getCookie(input: RequestHeaders, name: string): string | null {
  const cookieHeader = getHeader(input, 'cookie')
  if (!cookieHeader) return null

  // Parse cookie header (RFC 6265) with early return optimization
  const pairs = cookieHeader.split(';')
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].trim()
    const eqIndex = pair.indexOf('=')

    // Handle malformed cookies (no = sign)
    if (eqIndex === -1) continue

    const key = pair.slice(0, eqIndex)
    if (key === name) {
      const value = pair.slice(eqIndex + 1)
      try {
        return decodeURIComponent(value)
      } catch {
        // Return raw value if decoding fails
        return value
      }
    }
  }

  return null
}

/**
 * Get all cookies from headers as a Record
 * More efficient than multiple getCookie() calls when you need all cookies.
 *
 * @param input - Headers from any framework
 * @returns Record of all cookie key-value pairs (URL-decoded)
 *
 * @example
 * const cookies = getAllCookies(await headers())
 * const { 'bloom.sid': sessionId, theme } = cookies
 *
 * @see {@link ./headers.md} for framework-specific examples
 */
export function getAllCookies(input: RequestHeaders): Record<string, string> {
  const cookieHeader = getHeader(input, 'cookie')
  if (!cookieHeader) return {}

  const cookies: Record<string, string> = {}
  const pairs = cookieHeader.split(';')

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].trim()
    const eqIndex = pair.indexOf('=')

    // Skip malformed cookies
    if (eqIndex === -1) continue

    const key = pair.slice(0, eqIndex)
    const value = pair.slice(eqIndex + 1)

    try {
      cookies[key] = decodeURIComponent(value)
    } catch {
      // Store raw value if decoding fails
      cookies[key] = value
    }
  }

  return cookies
}

/**
 * Extract headers into a normalized Map
 *
 * @param input - Headers from any framework
 * @returns Map<string, string> with lowercase keys
 *
 * @example
 * const allHeaders = extractHeaders(await headers())
 * for (const [key, value] of allHeaders.entries()) {
 *   console.log(`${key}: ${value}`)
 * }
 *
 * @see {@link ./headers.md} for framework-specific examples
 */
export function extractHeaders(input: RequestHeaders): Map<string, string> {
  const result = new Map<string, string>()

  // Web API Headers or ReadonlyHeaders (has entries() method)
  if (hasEntries(input)) {
    for (const [key, value] of input.entries()) {
      result.set(key.toLowerCase(), value)
    }
    return result
  }

  // Plain object or H3/Express headers
  if (input && typeof input === 'object' && !hasGet(input)) {
    for (const [key, value] of Object.entries(input)) {
      if (!value) continue
      const normalized = Array.isArray(value) ? value[0] : value
      if (normalized) {
        result.set(key.toLowerCase(), normalized)
      }
    }
    return result
  }

  // Map
  if (input instanceof Map) {
    for (const [key, value] of input.entries()) {
      result.set(key.toLowerCase(), value)
    }
    return result
  }

  // Generic interface with get() - can't enumerate
  if (hasGet(input)) {
    throw new Error('Cannot extract all headers from generic interface. Please pass Headers, ReadonlyHeaders, or plain object.')
  }

  return result
}

/**
 * Type guard to check if input has entries() method
 * @internal
 */
function hasEntries(input: unknown): input is { entries(): IterableIterator<[string, string]> } {
  return input != null && typeof input === 'object' && 'entries' in input && typeof input.entries === 'function'
}

/**
 * Type guard to check if input has get() method
 * @internal
 */
function hasGet(input: unknown): input is { get(name: string): string | null } {
  return input != null && typeof input === 'object' && 'get' in input && typeof input.get === 'function'
}
