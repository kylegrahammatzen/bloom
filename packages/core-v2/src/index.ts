export { bloomAuth } from '@/auth'
export type { BloomAuthConfig } from '@/auth'

export type {
  User,
  Session,
  SessionCookieData,
  ApiMethodParams,
} from '@/schemas'

export {
  UserSchema,
  SessionSchema,
  SessionCookieDataSchema,
  ApiMethodParamsSchema,
} from '@/schemas'

export type {
  BloomAuth,
  BloomAuthApi,
} from '@/types'

export type { RequestHeaders } from '@/utils/headers'
export {
  extractHeaders,
  getHeader,
  getCookie,
  getAllCookies,
} from '@/utils/headers'

export type { CookieOptions } from '@/utils/cookies'
export {
  parseSessionCookie,
  serializeSessionCookie,
  createSessionCookie,
  clearSessionCookie,
} from '@/utils/cookies'

export {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  generateSessionId,
  normalizeEmail,
  isValidEmail,
  checkPasswordStrength,
} from '@/utils/crypto'

export type { DatabaseAdapter } from '@/storage/adapter'

export type { Storage } from '@/schemas/storage'
export { memoryStorage } from '@/storage/memory'
export { redisStorage } from '@/storage/redis'
export type { RedisClient, RedisStorageOptions } from '@/storage/redis'
