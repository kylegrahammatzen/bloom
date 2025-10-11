import type { User, Session, BloomPlugin } from '@/types'

/**
 * Client plugin interface
 */
export type ClientPlugin = {
  /**
   * Unique plugin identifier
   */
  id: string

  /**
   * Type inference from server plugin (for TypeScript)
   */
  $InferServerPlugin?: BloomPlugin

  /**
   * Additional client-side methods provided by the plugin
   */
  getActions?: (fetchFn: any) => Record<string, any>

  /**
   * Custom path methods (defaults to GET if no body, POST if body required)
   */
  pathMethods?: Record<string, 'GET' | 'POST'>
}

/**
 * Client configuration options
 */
export type ClientConfig = {
  /**
   * Base URL for API requests
   * @default '/auth'
   */
  baseUrl?: string

  /**
   * Fetch credentials mode
   * @default 'include'
   */
  credentials?: 'include' | 'omit' | 'same-origin'

  /**
   * Custom headers to include in all requests
   */
  headers?: Record<string, string>

  /**
   * Error handler called on request failures
   */
  onError?: (error: BloomError) => void

  /**
   * Success handler called on successful responses
   */
  onSuccess?: (data: unknown) => void

  /**
   * Client plugins to extend functionality
   */
  plugins?: ClientPlugin[]
}

/**
 * Standardized error response from Bloom API
 */
export type BloomError = {
  code: string
  message: string
  status: number
}

/**
 * Bloom API response wrapper
 */
export type BloomResponse<T> = {
  data: T | null
  error: BloomError | null
}

/**
 * Auth methods interface
 */
export type AuthMethods = {
  register(body: { email: string; password: string; name?: string }): Promise<BloomResponse<{ user: User; session: Session }>>
  login(body: { email: string; password: string }): Promise<BloomResponse<{ user: User; session: Session }>>
  logout(): Promise<BloomResponse<{ message: string }>>
  getSession(): Promise<BloomResponse<{ user: User; session: Session }>>
  getSessions(): Promise<BloomResponse<Session[]>>
  deleteSession(id: string): Promise<BloomResponse<{ message: string }>>
  deleteAllSessions(): Promise<BloomResponse<{ message: string }>>
  sendVerificationEmail(): Promise<BloomResponse<{ message: string }>>
  verifyEmail(body: { token: string }): Promise<BloomResponse<{ message: string }>>
  requestPasswordReset(body: { email: string }): Promise<BloomResponse<{ message: string }>>
  resetPassword(body: { token: string; password: string }): Promise<BloomResponse<{ message: string }>>
}

/**
 * Main Bloom client type
 */
export type BloomClient = {
  auth: AuthMethods
  [key: string]: any
}

export type { User, Session }
