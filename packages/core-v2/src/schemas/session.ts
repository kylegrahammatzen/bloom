import { z } from 'zod'

/**
 * Session schema with Zod v4 validation and metadata
 */
export const SessionSchema = z.object({
  id: z.string().meta({
    id: 'session_id',
    title: 'Session ID',
    description: 'Unique identifier for the session',
  }),
  userId: z.string().meta({
    id: 'session_user_id',
    title: 'User ID',
    description: 'ID of the user this session belongs to',
  }),
  expiresAt: z.date().meta({
    id: 'session_expires_at',
    title: 'Expires At',
    description: 'Timestamp when this session expires',
  }),
  createdAt: z.date().meta({
    id: 'session_created_at',
    title: 'Created At',
    description: 'Timestamp when the session was created',
  }),
  lastAccessedAt: z.date().meta({
    id: 'session_last_accessed_at',
    title: 'Last Accessed At',
    description: 'Timestamp when the session was last accessed',
  }),
  ipAddress: z.union([z.ipv4(), z.ipv6()]).optional().meta({
    id: 'session_ip_address',
    title: 'IP Address',
    description: 'IP address (IPv4 or IPv6) where the session was created',
  }),
  userAgent: z.string().optional().meta({
    id: 'session_user_agent',
    title: 'User Agent',
    description: 'Browser user agent string',
  }),
  browser: z.string().optional().meta({
    id: 'session_browser',
    title: 'Browser',
    description: 'Parsed browser name',
  }),
  os: z.string().optional().meta({
    id: 'session_os',
    title: 'Operating System',
    description: 'Parsed operating system name',
  }),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional().meta({
    id: 'session_device_type',
    title: 'Device Type',
    description: 'Type of device used for this session',
  }),
})

/**
 * Session cookie data schema (minimal data stored in cookie)
 */
export const SessionCookieDataSchema = z.object({
  userId: z.string().meta({
    id: 'cookie_user_id',
    title: 'User ID',
    description: 'User ID stored in session cookie',
  }),
  sessionId: z.string().meta({
    id: 'cookie_session_id',
    title: 'Session ID',
    description: 'Session ID stored in cookie',
  }),
})

/**
 * Inferred TypeScript types from schemas
 */
export type Session = z.infer<typeof SessionSchema>
export type SessionCookieData = z.infer<typeof SessionCookieDataSchema>
