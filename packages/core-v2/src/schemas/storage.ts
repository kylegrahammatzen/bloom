import { z } from 'zod'

export const CreateUserDataSchema = z.object({
  email: z.string().email().meta({
    id: 'create_user_email',
    title: 'Email',
    description: 'User email address',
  }),
  password_hash: z.string().min(1).meta({
    id: 'create_user_password_hash',
    title: 'Password Hash',
    description: 'Hashed password',
  }),
  password_salt: z.string().min(1).meta({
    id: 'create_user_password_salt',
    title: 'Password Salt',
    description: 'Password salt',
  }),
  email_verified: z.boolean().optional().meta({
    id: 'create_user_email_verified',
    title: 'Email Verified',
    description: 'Whether the email has been verified',
  }),
  name: z.string().optional().meta({
    id: 'create_user_name',
    title: 'Name',
    description: 'Optional display name',
  }),
})

export const UpdateUserDataSchema = z.object({
  email: z.string().email().optional().meta({
    id: 'update_user_email',
    title: 'Email',
    description: 'User email address',
  }),
  password_hash: z.string().min(1).optional().meta({
    id: 'update_user_password_hash',
    title: 'Password Hash',
    description: 'Hashed password',
  }),
  password_salt: z.string().min(1).optional().meta({
    id: 'update_user_password_salt',
    title: 'Password Salt',
    description: 'Password salt',
  }),
  email_verified: z.boolean().optional().meta({
    id: 'update_user_email_verified',
    title: 'Email Verified',
    description: 'Whether the email has been verified',
  }),
})

export const CreateSessionDataSchema = z.object({
  id: z.string().min(1).meta({
    id: 'create_session_id',
    title: 'Session ID',
    description: 'Unique session identifier',
  }),
  userId: z.string().min(1).meta({
    id: 'create_session_user_id',
    title: 'User ID',
    description: 'ID of the user this session belongs to',
  }),
  expiresAt: z.date().meta({
    id: 'create_session_expires_at',
    title: 'Expires At',
    description: 'When the session expires',
  }),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional().meta({
    id: 'create_session_device_type',
    title: 'Device Type',
    description: 'Type of device',
  }),
  ipAddress: z.union([z.ipv4(), z.ipv6()]).optional().meta({
    id: 'create_session_ip_address',
    title: 'IP Address',
    description: 'IP address of the session',
  }),
  userAgent: z.string().optional().meta({
    id: 'create_session_user_agent',
    title: 'User Agent',
    description: 'Browser user agent',
  }),
})

export type CreateUserData = z.infer<typeof CreateUserDataSchema>
export type UpdateUserData = z.infer<typeof UpdateUserDataSchema>
export type CreateSessionData = z.infer<typeof CreateSessionDataSchema>

/**
 * Storage interface for caching (Redis, Memory, etc.)
 * Used for rate limiting, session caching, and temporary data
 */
export type Storage = {
  /**
   * Get value by key
   * @returns Value or null if not found or expired
   */
  get: (key: string) => Promise<string | null>

  /**
   * Set value with optional TTL (time to live in seconds)
   * @param key - Storage key
   * @param value - Value to store (string)
   * @param ttl - Optional TTL in seconds
   */
  set: (key: string, value: string, ttl?: number) => Promise<void>

  /**
   * Delete value by key
   * @param key - Storage key
   */
  delete: (key: string) => Promise<void>
}
