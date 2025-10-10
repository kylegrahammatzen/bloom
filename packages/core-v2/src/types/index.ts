import type { RequestHeaders } from '@/utils/headers'
import type { User, Session, SessionCookieData, ApiMethodParams } from '@/schemas'
import type { EventHandler } from '@/events/emitter'

/**
 * Re-export Zod-inferred types from schemas
 */
export type { User, Session, SessionCookieData, ApiMethodParams } from '@/schemas'

/**
 * Re-export event types
 */
export type { EventHandler } from '@/events/emitter'

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
  // More methods will be added as we port from v1
}

/**
 * Main BloomAuth instance
 */
export type BloomAuth = {
  api: BloomAuthApi

  /**
   * Register an event listener
   * Supports wildcard patterns: 'user.*', '*.created', '*'
   */
  on: (event: string, handler: EventHandler) => void

  /**
   * Emit an event to all matching listeners
   */
  emit: (event: string, data?: any) => Promise<void>

  /**
   * Remove an event listener
   */
  off: (event: string, handler: EventHandler) => void

  /**
   * Event introspection methods
   */
  events: {
    /**
     * List all registered event names
     */
    list: () => string[]

    /**
     * Get all listeners for a specific event
     */
    listeners: (event: string) => EventHandler[]
  }
}
