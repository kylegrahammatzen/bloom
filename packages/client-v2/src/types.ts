import type { User, Session, ApiMethodParams } from '@bloom/core-v2'

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
  $InferServerPlugin?: any

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
  credentials?: RequestCredentials

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
 * Helper types for auth responses
 */
type AuthResponse = { user: User; session: Session }
type MessageResponse = { message: string }

/**
 * Auth methods interface
 */
export type AuthMethods = {
  register(body: { email: string; password: string; name?: string }): Promise<BloomResponse<AuthResponse>>
  login(body: { email: string; password: string }): Promise<BloomResponse<AuthResponse>>
  logout(): Promise<BloomResponse<MessageResponse>>
  getSession(): Promise<BloomResponse<AuthResponse>>
  getSessions(): Promise<BloomResponse<Session[]>>
  deleteSession(id: string): Promise<BloomResponse<MessageResponse>>
  deleteAllSessions(): Promise<BloomResponse<MessageResponse>>
  sendVerificationEmail(): Promise<BloomResponse<MessageResponse>>
  verifyEmail(body: { token: string }): Promise<BloomResponse<MessageResponse>>
  requestPasswordReset(body: { email: string }): Promise<BloomResponse<MessageResponse>>
  resetPassword(body: { token: string; password: string }): Promise<BloomResponse<MessageResponse>>
}

/**
 * Main Bloom client type
 */
export type BloomClient = {
  auth: AuthMethods
  [key: string]: any
}

export type { User, Session }
