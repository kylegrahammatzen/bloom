import { z } from 'zod'
import type { Context } from '@/handler/context'

/**
 * Rate limit rule object
 */
const RateLimitRuleObjectSchema = z.object({
  window: z.number().int().positive().meta({
    id: 'rate_limit_rule_window',
    title: 'Window',
    description: 'Time window in seconds',
  }),
  max: z.number().int().positive().meta({
    id: 'rate_limit_rule_max',
    title: 'Max',
    description: 'Maximum requests in the window',
  }),
})

/**
 * Rate limit rule - can be an object, function, or false to disable
 */
export const RateLimitRuleSchema = z.union([
  RateLimitRuleObjectSchema,
  z.custom<(ctx: Context) => Promise<{ window: number; max: number } | false>>(),
  z.literal(false)
])

/**
 * Rate limit configuration
 */
export const RateLimitConfigSchema = z.object({
  enabled: z.boolean().optional().meta({
    id: 'rate_limit_enabled',
    title: 'Enabled',
    description: 'Enable rate limiting (auto-enabled in production)',
  }),
  window: z.number().int().positive().meta({
    id: 'rate_limit_window',
    title: 'Window',
    description: 'Default time window in seconds',
  }),
  max: z.number().int().positive().meta({
    id: 'rate_limit_max',
    title: 'Max',
    description: 'Default maximum requests in the window',
  }),
  ipHeaders: z.array(z.string()).optional().meta({
    id: 'rate_limit_ip_headers',
    title: 'IP Headers',
    description: 'Headers to check for IP address in order',
  }),
  rules: z.record(z.string(), RateLimitRuleSchema).optional().meta({
    id: 'rate_limit_rules',
    title: 'Rules',
    description: 'Custom rules for specific paths',
  }),
})

/**
 * Database record for rate limiting
 */
export const RateLimitRecordSchema = z.object({
  id: z.string().min(1).meta({
    id: 'rate_limit_record_id',
    title: 'ID',
    description: 'Primary key',
  }),
  key: z.string().min(1).meta({
    id: 'rate_limit_record_key',
    title: 'Key',
    description: 'Unique identifier (e.g., "ip:192.168.1.1:/sign-in/email")',
  }),
  count: z.number().int().nonnegative().meta({
    id: 'rate_limit_record_count',
    title: 'Count',
    description: 'Number of requests in current window',
  }),
  lastRequest: z.bigint().meta({
    id: 'rate_limit_record_last_request',
    title: 'Last Request',
    description: 'Timestamp of last request in milliseconds',
  }),
  expiresAt: z.date().meta({
    id: 'rate_limit_record_expires_at',
    title: 'Expires At',
    description: 'When this record expires for auto-cleanup',
  }),
})

export type RateLimitRule = z.infer<typeof RateLimitRuleSchema>
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>
export type RateLimitRecord = z.infer<typeof RateLimitRecordSchema>
