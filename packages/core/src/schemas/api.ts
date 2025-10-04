import { z } from 'zod';

/**
 * User schema for runtime validation and type inference
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  email_verified: z.boolean(),
  name: z.string().optional(),
  image: z.string().url().optional(),
  created_at: z.date(),
  updated_at: z.date(),
  last_login: z.date().optional(),
});

/**
 * Session schema for runtime validation and type inference
 */
export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  lastAccessedAt: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional(),
  isCurrent: z.boolean().optional(),
  user: UserSchema.optional(),
});

/**
 * Generic request schema for API handlers
 */
export const GenericRequestSchema = z.object({
  method: z.string(),
  path: z.string(),
  url: z.string().optional(),
  body: z.any().optional(),
  headers: z.record(z.string(), z.union([z.string(), z.array(z.string()), z.undefined()])).optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});

/**
 * Generic response schema for API handlers
 */
export const GenericResponseSchema = z.object({
  status: z.number().int().min(100).max(599),
  body: z.any(),
  sessionData: z.any().optional(),
  clearSession: z.boolean().optional(),
});

/**
 * Auth event context schema for callbacks
 */
export const AuthEventContextSchema = z.object({
  action: z.string(),
  userId: z.string().optional(),
  email: z.email().optional(),
  endpoint: z.string(),
  ip: z.string().optional(),
});

/**
 * Inferred TypeScript types from schemas
 * Use these instead of manually maintaining duplicate types
 */
export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type GenericRequest = z.infer<typeof GenericRequestSchema>;
export type GenericResponse = z.infer<typeof GenericResponseSchema>;
export type AuthEventContext = z.infer<typeof AuthEventContextSchema>;
