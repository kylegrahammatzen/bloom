import { z } from 'zod'

/**
 * API method parameters schema
 * Note: headers are unknown since they can be any framework type
 */
export const ApiMethodParamsSchema = z.object({
  headers: z.unknown().optional().meta({
    id: 'headers',
    title: 'Request Headers',
    description: 'HTTP headers from any framework (Headers, ReadonlyHeaders, plain object, etc.)',
  }),
  body: z.record(z.string(), z.unknown()).optional().meta({
    id: 'body',
    title: 'Request Body',
    description: 'Request body data as key-value pairs',
  }),
  query: z.record(z.string(), z.unknown()).optional().meta({
    id: 'query',
    title: 'Query Parameters',
    description: 'URL query parameters as key-value pairs',
  }),
})

/**
 * Inferred TypeScript type from ApiMethodParamsSchema
 */
export type ApiMethodParams = z.infer<typeof ApiMethodParamsSchema>

/**
 * Registration request body schema
 */
export const RegisterRequestSchema = z.object({
  email: z.email().meta({
    id: 'register_email',
    title: 'Email',
    description: 'User email address',
  }),
  password: z.string().meta({
    id: 'register_password',
    title: 'Password',
    description: 'User password (length validated per config)',
  }),
  name: z.string().optional().meta({
    id: 'register_name',
    title: 'Name',
    description: 'Optional display name',
  }),
})

/**
 * Login request body schema
 */
export const LoginRequestSchema = z.object({
  email: z.email().meta({
    id: 'login_email',
    title: 'Email',
    description: 'User email address',
  }),
  password: z.string().meta({
    id: 'login_password',
    title: 'Password',
    description: 'User password',
  }),
})

/**
 * Auth response schema (used for register and login)
 */
export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.email(),
    name: z.string().optional(),
    email_verified: z.boolean(),
  }),
  session: z.object({
    id: z.string(),
    expiresAt: z.date(),
  }),
})

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>

/**
 * Session item schema (for listing sessions)
 */
export const SessionItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().optional(),
  lastAccessed: z.date().optional(),
})

/**
 * Sessions list response schema
 */
export const SessionsListResponseSchema = z.object({
  sessions: z.array(SessionItemSchema),
})

/**
 * Delete session response schema
 */
export const DeleteSessionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

/**
 * Delete all sessions response schema
 */
export const DeleteAllSessionsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  count: z.number(),
})

export type SessionItem = z.infer<typeof SessionItemSchema>
export type SessionsListResponse = z.infer<typeof SessionsListResponseSchema>
export type DeleteSessionResponse = z.infer<typeof DeleteSessionResponseSchema>
export type DeleteAllSessionsResponse = z.infer<typeof DeleteAllSessionsResponseSchema>

/**
 * Send verification email request schema
 */
export const SendVerificationEmailRequestSchema = z.object({
  email: z.email().meta({
    id: 'send_verification_email',
    title: 'Email',
    description: 'Email address to send verification link to',
  }),
})

/**
 * Verify email request schema
 */
export const VerifyEmailRequestSchema = z.object({
  token: z.string().meta({
    id: 'verify_email_token',
    title: 'Verification Token',
    description: 'Email verification token',
  }),
})

/**
 * Request password reset schema
 */
export const RequestPasswordResetSchema = z.object({
  email: z.email().meta({
    id: 'reset_password_email',
    title: 'Email',
    description: 'Email address for password reset',
  }),
})

/**
 * Reset password schema
 */
export const ResetPasswordSchema = z.object({
  token: z.string().meta({
    id: 'reset_password_token',
    title: 'Reset Token',
    description: 'Password reset token',
  }),
  password: z.string().meta({
    id: 'reset_password_new',
    title: 'New Password',
    description: 'New password (length validated per config)',
  }),
})

export type SendVerificationEmailRequest = z.infer<typeof SendVerificationEmailRequestSchema>
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>
export type RequestPasswordReset = z.infer<typeof RequestPasswordResetSchema>
export type ResetPassword = z.infer<typeof ResetPasswordSchema>
