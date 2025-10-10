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
