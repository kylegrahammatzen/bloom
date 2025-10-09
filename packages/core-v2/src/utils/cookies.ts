import { SessionCookieDataSchema, type SessionCookieData } from '../schemas'

/**
 * Cookie configuration options
 */
export type CookieOptions = {
  cookieName?: string
  maxAge?: number // in seconds
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  path?: string
  domain?: string
}

/**
 * Default cookie options for session cookies
 */
const DEFAULT_COOKIE_OPTIONS: Required<Omit<CookieOptions, 'domain'>> = {
  cookieName: 'bloom.sid',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}

/**
 * Parse and validate session cookie JSON
 *
 * @param cookieValue - Raw cookie value (JSON string)
 * @returns Parsed and validated SessionCookieData or null if invalid
 *
 * @example
 * const sessionData = parseSessionCookie('{"userId":"123","sessionId":"abc"}')
 * if (sessionData) {
 *   console.log(sessionData.userId, sessionData.sessionId)
 * }
 */
export function parseSessionCookie(cookieValue: string): SessionCookieData | null {
  try {
    const data = JSON.parse(cookieValue)
    const result = SessionCookieDataSchema.safeParse(data)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

/**
 * Serialize session data to JSON for storage in cookie
 *
 * @param data - Session cookie data to serialize
 * @returns JSON string
 *
 * @example
 * const json = serializeSessionCookie({ userId: '123', sessionId: 'abc' })
 * // Returns: '{"userId":"123","sessionId":"abc"}'
 */
export function serializeSessionCookie(data: SessionCookieData): string {
  return JSON.stringify(data)
}

/**
 * Create Set-Cookie header string for session cookie
 *
 * @param data - Session data to store in cookie
 * @param options - Cookie configuration options
 * @returns Set-Cookie header string
 *
 * @example
 * const setCookie = createSessionCookie(
 *   { userId: '123', sessionId: 'abc' },
 *   { maxAge: 3600, secure: true }
 * )
 * // Use in response headers
 */
export function createSessionCookie(
  data: SessionCookieData,
  options: CookieOptions = {}
): string {
  const opts = { ...DEFAULT_COOKIE_OPTIONS, ...options }
  const value = encodeURIComponent(serializeSessionCookie(data))

  const parts = [
    `${opts.cookieName}=${value}`,
    `Max-Age=${opts.maxAge}`,
    `Path=${opts.path}`,
    `SameSite=${opts.sameSite.charAt(0).toUpperCase() + opts.sameSite.slice(1)}`,
  ]

  if (opts.httpOnly) {
    parts.push('HttpOnly')
  }

  if (opts.secure) {
    parts.push('Secure')
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`)
  }

  return parts.join('; ')
}

/**
 * Create Set-Cookie header to clear/delete session cookie
 *
 * @param cookieName - Name of cookie to clear (defaults to 'bloom.sid')
 * @returns Set-Cookie header string with Max-Age=0
 *
 * @example
 * const clearCookie = clearSessionCookie()
 * // Use in logout response headers
 */
export function clearSessionCookie(cookieName = 'bloom.sid'): string {
  return `${cookieName}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
}
