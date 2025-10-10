/**
 * Zod v4 schemas and inferred types
 * All schemas use 'zod' for v4 compatibility
 */

export { UserSchema, type User } from './user'
export { SessionSchema, SessionCookieDataSchema, type Session, type SessionCookieData } from './session'
export {
  ApiMethodParamsSchema,
  RegisterRequestSchema,
  LoginRequestSchema,
  AuthResponseSchema,
  type ApiMethodParams,
  type RegisterRequest,
  type LoginRequest,
  type AuthResponse,
} from './api'
export {
  CreateUserDataSchema,
  UpdateUserDataSchema,
  CreateSessionDataSchema,
  type CreateUserData,
  type UpdateUserData,
  type CreateSessionData,
  type Storage,
} from './storage'
export {
  RateLimitConfigSchema,
  RateLimitRuleSchema,
  RateLimitRecordSchema,
  type RateLimitConfig,
  type RateLimitRule,
  type RateLimitRecord,
} from './rateLimit'
