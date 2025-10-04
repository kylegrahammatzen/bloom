import { z } from 'zod';
import type { SecondaryStorage } from './storage';
import type { Mongoose } from 'mongoose';

/**
 * Zod schema for BloomAuthConfig with defaults
 */
export const BloomConfigSchema = z.object({
  database: z.custom<Mongoose | { uri: string }>().optional(),
  session: z.object({
    expiresIn: z.number().int().positive().default(7 * 24 * 60 * 60 * 1000),
    cookieName: z.string().default('bloom.sid'),
    secret: z.string().optional(),
    slidingWindow: z.boolean().optional(),
  }).optional().default({ expiresIn: 7 * 24 * 60 * 60 * 1000, cookieName: 'bloom.sid' }),
  logging: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
    enabled: z.boolean().optional(),
  }).optional(),
  emailAndPassword: z.object({
    enabled: z.boolean().default(true),
    requireEmailVerification: z.boolean().default(false),
  }).optional().default({ enabled: true, requireEmailVerification: false }),
  rateLimit: z.object({
    enabled: z.boolean().default(true),
    login: z.object({
      max: z.number().int().positive().optional(),
      window: z.number().int().positive().optional(),
    }).optional(),
    registration: z.object({
      max: z.number().int().positive().optional(),
      window: z.number().int().positive().optional(),
    }).optional(),
    passwordReset: z.object({
      max: z.number().int().positive().optional(),
      window: z.number().int().positive().optional(),
    }).optional(),
  }).optional().default({ enabled: true }),
  secondaryStorage: z.custom<SecondaryStorage>().optional(),
  callbacks: z.record(z.string(), z.any()).optional().default({}),
  plugins: z.array(z.any()).optional().default([]),
});

/**
 * BloomAuthConfig type inferred from Zod schema
 */
export type BloomAuthConfig = z.infer<typeof BloomConfigSchema>;
