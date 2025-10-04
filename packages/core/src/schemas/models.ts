import { z } from 'zod';
import { extendZod, zId } from '@zodyac/zod-mongoose';

extendZod(z);

/**
 * User model schema
 */
export const UserModelSchema = z.object({
  email: z.email().toLowerCase().trim().max(255),
  name: z.string().trim().max(255).optional(),
  image: z.string().url().max(2048).optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  email_verified: z.boolean().default(false),
  last_login: z.date().optional(),
});

/**
 * Session model schema
 */
export const SessionModelSchema = z.object({
  session_id: z.string(),
  user_id: zId('User'),
  expires_at: z.date(),
  user_agent: z.string().max(500).optional(),
  ip_address: z.string().max(45).optional(),
  created_at: z.date().default(() => new Date()),
  last_accessed: z.date().default(() => new Date()),
});

/**
 * UserCredentials model schema
 */
export const UserCredentialsModelSchema = z.object({
  user_id: zId('User'),
  password_hash: z.string(),
  salt: z.string(),
  failed_login_attempts: z.number().int().default(0),
  locked_until: z.date().optional(),
});

/**
 * Token model schema
 */
export const TokenModelSchema = z.object({
  token_hash: z.string(),
  type: z.enum(['email_verification', 'password_reset']),
  user_id: zId('User'),
  expires_at: z.date(),
  used_at: z.date().optional(),
  created_at: z.date().default(() => new Date()),
});
