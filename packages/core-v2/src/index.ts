export { bloomAuth } from './auth'
export type { BloomAuthConfig } from './auth'

// Export types from schemas (Zod-inferred)
export type {
  User,
  Session,
  SessionCookieData,
  ApiMethodParams,
} from './schemas'

// Export Zod schemas for runtime validation
export {
  UserSchema,
  SessionSchema,
  SessionCookieDataSchema,
  ApiMethodParamsSchema,
} from './schemas'

// Export remaining types
export type {
  BloomAuth,
  BloomAuthApi,
} from './types'

// Export header utilities and types
export type { RequestHeaders } from './utils/headers'
export {
  extractHeaders,
  getHeader,
  getCookie,
  getAllCookies,
} from './utils/headers'

// Export cookie utilities
export type { CookieOptions } from './utils/cookies'
export {
  parseSessionCookie,
  serializeSessionCookie,
  createSessionCookie,
  clearSessionCookie,
} from './utils/cookies'

// Export crypto utilities
export {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  generateSessionId,
  normalizeEmail,
  isValidEmail,
  checkPasswordStrength,
} from './utils/crypto'

// Export storage adapter types and implementations
export type { StorageAdapter } from './storage/adapter'
export { InMemoryStorageAdapter } from './storage/in-memory'
