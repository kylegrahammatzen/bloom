import type { User, Session } from '@/types'

/**
 * Request context that flows through the handler pipeline
 * Contains all request data and state
 */
export type Context = {
  /** Original Web Standard Request */
  request: Request

  /** HTTP method (GET, POST, DELETE, etc.) */
  method: string

  /** Request path (/auth/session) */
  path: string

  /** URL query parameters */
  query: Record<string, string>

  /** Request headers */
  headers: Headers

  /** Parsed request body (if POST/PUT/PATCH) */
  body: any

  /** URL path parameters (e.g., { id: '123' } from /sessions/:id) */
  params: Record<string, string>

  /** Current user (if authenticated) */
  user: User | null

  /** Current session (if exists) */
  session: Session | null
}

/**
 * Build context from Web Standard Request
 */
export async function buildContext(request: Request): Promise<Omit<Context, 'params' | 'user' | 'session'>> {
  const url = new URL(request.url)
  const method = request.method
  const path = url.pathname
  const query = Object.fromEntries(url.searchParams)
  const headers = request.headers

  // Parse body for POST/PUT/PATCH requests
  let body: any = null
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const contentType = headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const text = await request.text()
      body = text ? JSON.parse(text) : null
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      body = Object.fromEntries(formData)
    }
  }

  return {
    request,
    method,
    path,
    query,
    headers,
    body,
  }
}
