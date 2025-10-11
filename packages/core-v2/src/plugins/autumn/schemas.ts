import { z } from 'zod'
import type { ApiMethodParams } from '@/schemas'

/**
 * Autumn plugin configuration
 */
export const AutumnConfigSchema = z.object({
  apiKey: z.string().optional(),
  apiUrl: z.url().optional(),
  /**
   * Customer cache TTL in seconds
   * @default 300 (5 minutes)
   */
  customerCacheTTL: z.number().int().positive().optional(),
  /**
   * Custom function to get customer ID from request
   * By default uses userId from session, but can be customized for org-based tracking
   */
  getCustomerId: z.function().args(z.custom<ApiMethodParams>()).returns(z.promise(z.string())).optional(),
})

export type AutumnConfig = z.infer<typeof AutumnConfigSchema>

/**
 * Autumn API response schemas
 */
export const AutumnCheckResponseSchema = z.object({
  data: z.object({
    allowed: z.boolean(),
    remaining: z.number().optional(),
    limit: z.number().optional(),
  }),
})

export const AutumnTrackResponseSchema = z.object({
  success: z.boolean(),
})

export const AutumnCheckoutResponseSchema = z.object({
  url: z.url(),
})

export const AutumnAttachResponseSchema = z.object({
  success: z.boolean(),
  url: z.url().optional(),
})

export const AutumnCancelResponseSchema = z.object({
  success: z.boolean(),
})

export const AutumnBillingPortalResponseSchema = z.object({
  url: z.url(),
})

export const AutumnEntityResponseSchema = z.object({
  id: z.string(),
  feature_id: z.string(),
  customer_id: z.string(),
  data: z.record(z.string(), z.any()).optional(),
})

export const AutumnQueryResponseSchema = z.object({
  data: z.array(z.object({
    feature_id: z.string().optional(),
    usage: z.number(),
    limit: z.number().optional(),
    period_start: z.string().optional(),
    period_end: z.string().optional(),
  })),
})

export const AutumnCustomerResponseSchema = z.object({
  autumn_id: z.string(),
  created_at: z.number(),
  env: z.string(),
  id: z.string(),
  name: z.string().optional(),
  email: z.string().optional(),
  fingerprint: z.string().optional(),
  stripe_id: z.string().optional(),
  products: z.array(z.object({
    id: z.string(),
    name: z.string().nullable(),
    group: z.string().nullable(),
    status: z.enum(['active', 'past_due', 'trialing', 'scheduled']),
    started_at: z.number(),
    canceled_at: z.number().nullable(),
    current_period_start: z.number().nullable(),
    current_period_end: z.number().nullable(),
  })),
  features: z.array(z.object({
    feature_id: z.string(),
    unlimited: z.boolean(),
    interval: z.enum(['month', 'year']).nullable(),
    balance: z.number().nullable(),
    usage: z.number().nullable(),
    included_usage: z.number().nullable(),
    next_reset_at: z.number().nullable(),
  })),
  invoices: z.array(z.object({
    product_ids: z.array(z.string()),
    stripe_id: z.string(),
    status: z.enum(['paid', 'unpaid', 'void']),
    total: z.number(),
    currency: z.string(),
    created_at: z.number(),
    hosted_invoice_url: z.url(),
  })).optional(),
})

export type AutumnCheckResponse = z.infer<typeof AutumnCheckResponseSchema>
export type AutumnTrackResponse = z.infer<typeof AutumnTrackResponseSchema>
export type AutumnCheckoutResponse = z.infer<typeof AutumnCheckoutResponseSchema>
export type AutumnAttachResponse = z.infer<typeof AutumnAttachResponseSchema>
export type AutumnCancelResponse = z.infer<typeof AutumnCancelResponseSchema>
export type AutumnBillingPortalResponse = z.infer<typeof AutumnBillingPortalResponseSchema>
export type AutumnEntityResponse = z.infer<typeof AutumnEntityResponseSchema>
export type AutumnQueryResponse = z.infer<typeof AutumnQueryResponseSchema>
export type AutumnCustomerResponse = z.infer<typeof AutumnCustomerResponseSchema>
