import type { RequestHeaders } from '@/utils/headers'
import type { User, Session, SessionCookieData, ApiMethodParams, Storage } from '@/schemas'
import type { Router } from '@/handler/router'
import type { Context } from '@/handler/context'

/**
 * Re-export Zod-inferred types from schemas
 */
export type { User, Session, SessionCookieData, ApiMethodParams } from '@/schemas'

/**
 * Legacy type alias for backwards compatibility
 * @deprecated Use RequestHeaders from '@/utils/headers' instead
 */
export type HeadersInput = RequestHeaders

/**
 * Auth API methods
 */
export type BloomAuthApi = {
  getSession(params: ApiMethodParams): Promise<{ user: User; session: Session } | null>
  // Plugins can extend this with additional methods
  [key: string]: any
}

/**
 * Plugin route definition
 */
export type PluginRoute = {
  path: string
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'
  handler: (ctx: Context) => Promise<Response>
}

/**
 * Plugin hook definition
 */
export type PluginHooks = Record<string, {
  before?: (ctx: Context) => Promise<void | Response>
  after?: (ctx: Context) => Promise<void | Response>
}>

/**
 * Bloom plugin interface
 */
export type BloomPlugin = {
  /**
   * Unique plugin identifier
   */
  id: string

  /**
   * HTTP routes to register
   */
  routes?: PluginRoute[]

  /**
   * Path-based hooks to register
   */
  hooks?: PluginHooks

  /**
   * API methods to register at auth.api[id]
   * Receives auth instance and optional storage
   */
  api?: (auth: BloomAuth, storage?: Storage) => Record<string, (...args: any[]) => any>
}

/**
 * Main BloomAuth instance
 */
export type BloomAuth = {
  api: BloomAuthApi

  /**
   * HTTP handler (Web Standard Request into Response)
   * This is the core handler that processes all auth requests
   */
  handler: (request: Request) => Promise<Response>

  /**
   * Router for registering and matching routes
   */
  router: Router
}
