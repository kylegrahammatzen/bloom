import type { RequestHeaders } from '@/utils/headers'
import type { User, Session, SessionCookieData, ApiMethodParams } from '@/schemas'

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
  // More methods will be added as we port from v1
}

/**
 * Main BloomAuth instance
 */
export type BloomAuth = {
  api: BloomAuthApi
}
