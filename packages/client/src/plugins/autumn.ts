import type { ClientPlugin, BloomResponse } from '../types'
import { bloomFetch } from '../fetch'

/**
 * Autumn plugin methods for Stripe billing integration
 */
export type AutumnMethods = {
  check(body: { featureId?: string; productId?: string }): Promise<BloomResponse<{ allowed: boolean; remaining?: number; limit?: number }>>
  track(body: { featureId: string; value?: number }): Promise<BloomResponse<{ success: boolean }>>
  checkout(body: { productId: string; successUrl?: string }): Promise<BloomResponse<{ url: string }>>
  getCustomer(): Promise<BloomResponse<unknown>>
  attach(body: { productId: string; successUrl?: string; cancelUrl?: string }): Promise<BloomResponse<{ success: boolean; url?: string }>>
  cancel(body: { productId?: string }): Promise<BloomResponse<{ success: boolean }>>
  getBillingPortal(body?: { returnUrl?: string }): Promise<BloomResponse<{ url: string }>>
}

/**
 * Autumn client plugin for Stripe billing
 */
export const autumnClient = (): ClientPlugin => {
  return {
    id: 'autumn',
    getActions: () => {
      const autumn: AutumnMethods = {
        check: async (body) => {
          return bloomFetch<{ allowed: boolean; remaining?: number; limit?: number }>({
            path: '/autumn/check',
            options: {
              method: 'POST',
              body: JSON.stringify(body),
            },
          })
        },

        track: async (body) => {
          return bloomFetch<{ success: boolean }>({
            path: '/autumn/track',
            options: {
              method: 'POST',
              body: JSON.stringify(body),
            },
          })
        },

        checkout: async (body) => {
          return bloomFetch<{ url: string }>({
            path: '/autumn/checkout',
            options: {
              method: 'POST',
              body: JSON.stringify(body),
            },
          })
        },

        getCustomer: async () => {
          return bloomFetch<unknown>({
            path: '/autumn/customer',
            options: {
              method: 'GET',
            },
          })
        },

        attach: async (body) => {
          return bloomFetch<{ success: boolean; url?: string }>({
            path: '/autumn/attach',
            options: {
              method: 'POST',
              body: JSON.stringify(body),
            },
          })
        },

        cancel: async (body) => {
          return bloomFetch<{ success: boolean }>({
            path: '/autumn/cancel',
            options: {
              method: 'POST',
              body: JSON.stringify(body),
            },
          })
        },

        getBillingPortal: async (body) => {
          return bloomFetch<{ url: string }>({
            path: '/autumn/billing-portal',
            options: {
              method: 'POST',
              body: body ? JSON.stringify(body) : undefined,
            },
          })
        },
      }

      return { autumn }
    },
  }
}
