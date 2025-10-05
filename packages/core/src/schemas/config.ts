import { z } from 'zod';
import type { SecondaryStorage } from './storage';
import type { Logger, LoggerConfig } from './logger';
import type { Mongoose } from 'mongoose';

/**
 * Zod schema for BloomAuthConfig with defaults
 */
export const BloomConfigSchema = z.object({
  baseUrl: z.string().url().optional(),
  database: z.custom<Mongoose | { uri: string }>().optional(),
  session: z.object({
    expiresIn: z.number().int().positive().default(7 * 24 * 60 * 60 * 1000),
    cookieName: z.string().default('bloom.sid'),
    secret: z.string().optional(),
    slidingWindow: z.boolean().optional(),
  }).optional().default({ expiresIn: 7 * 24 * 60 * 60 * 1000, cookieName: 'bloom.sid' }),
  emailAndPassword: z.object({
    enabled: z.boolean().default(true),
    emailVerification: z.object({
      enabled: z.boolean().default(false),
      sendOnSignUp: z.boolean().default(false),
      callbackUrl: z.string().default('/'),
    }).optional(),
  }).optional().default({ enabled: true }),
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
    emailVerification: z.object({
      max: z.number().int().positive().optional(),
      window: z.number().int().positive().optional(),
    }).optional(),
  }).optional().default({ enabled: true }),
  secondaryStorage: z.custom<SecondaryStorage>().optional(),
  logger: z.custom<Logger | LoggerConfig>().optional(),
  callbacks: z.record(z.string(), z.any()).optional().default({}),
  plugins: z.array(z.any()).optional().default([]),
});

/**
 * BloomAuthConfig type - all fields optional, defaults applied at runtime by Zod
 */
export type BloomAuthConfig = {
  baseUrl?: string;
  database?: Mongoose | { uri: string };
  session?: {
    expiresIn?: number;
    cookieName?: string;
    secret?: string;
    slidingWindow?: boolean;
  };
  emailAndPassword?: {
    enabled?: boolean;
    emailVerification?: {
      enabled?: boolean;
      sendOnSignUp?: boolean;
      callbackUrl?: string;
    };
  };
  rateLimit?: {
    enabled?: boolean;
    login?: {
      max?: number;
      window?: number;
    };
    registration?: {
      max?: number;
      window?: number;
    };
    passwordReset?: {
      max?: number;
      window?: number;
    };
    emailVerification?: {
      max?: number;
      window?: number;
    };
  };
  secondaryStorage?: SecondaryStorage;
  logger?: Logger | LoggerConfig;
  callbacks?: Record<string, any>;
  plugins?: any[];
};
