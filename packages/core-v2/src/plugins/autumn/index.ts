import type { BloomPlugin, BloomAuth, ApiMethodParams } from '@/types'
import type { Storage } from '@/schemas'
import type {
  AutumnConfig,
  AutumnCheckResponse,
  AutumnTrackResponse,
  AutumnCheckoutResponse,
  AutumnAttachResponse,
  AutumnCancelResponse,
  AutumnBillingPortalResponse,
  AutumnEntityResponse,
  AutumnQueryResponse,
  AutumnCustomerResponse,
} from '@/plugins/autumn/schemas'

export type { AutumnConfig } from '@/plugins/autumn/schemas'

/**
 * Autumn plugin - provides pricing & billing integration
 *
 * Available methods:
 * - check(): Verify feature/product access
 * - track(): Record usage events
 * - checkout(): Create Stripe checkout session
 * - attach(): Attach product to customer (upgrade/downgrade)
 * - cancel(): Cancel product subscription
 * - getBillingPortal(): Get Stripe billing portal URL
 * - createEntity(): Create entities (seats, workspaces)
 * - getEntity(): Get entity information
 * - query(): Query usage data
 * - getCustomer(): Get customer subscription and usage data
 */
export const autumn = (config: AutumnConfig = {}): BloomPlugin => {
  const apiKey = config.apiKey || process.env.AUTUMN_SECRET_KEY
  const apiUrl = config.apiUrl || process.env.AUTUMN_API_URL || 'https://api.useautumn.com/v1'

  if (!apiKey) {
    throw new Error('Autumn API key is required. Set AUTUMN_SECRET_KEY environment variable or pass apiKey in config.')
  }

  return {
    id: 'autumn',

    api: (auth: BloomAuth, storage?: Storage) => {
      const cacheTTL = config.customerCacheTTL ?? 300

      const getCustomerId = async (params: ApiMethodParams): Promise<string> => {
        // Use custom getCustomerId if provided
        if (config.getCustomerId) {
          return await config.getCustomerId(params)
        }

        // Default: use userId from session
        const sessionData = await auth.api.getSession(params)

        if (!sessionData) {
          throw new Error('Not authenticated')
        }

        return sessionData.user.id
      }

      const ensureCustomer = async (customerId: string): Promise<void> => {
        // Only cache if storage is provided
        if (!storage) {
          // No storage, always try to create
          try {
            await autumnRequest('/customers', 'POST', { id: customerId })
          } catch {
            // Customer already exists or other error - either way we're good
          }
          return
        }

        // Check cache
        const cacheKey = `autumn:customer:${customerId}`
        const cached = await storage.get(cacheKey)
        if (cached) return

        // Try to create customer
        try {
          await autumnRequest('/customers', 'POST', { id: customerId })
        } catch {
          // Customer already exists or other error - either way we're good
        }

        // Cache the result
        await storage.set(cacheKey, '1', cacheTTL)
      }

      const autumnRequest = async <T>(endpoint: string, method: string = 'POST', body?: unknown): Promise<T> => {
        const url = `${apiUrl}${endpoint}`
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        })

        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = response.statusText

          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.message || errorJson.error || errorText
          } catch {
            errorMessage = errorText || response.statusText
          }

          console.error(`[Autumn API] ${method} ${url} failed:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
          })

          throw new Error(`Autumn API error (${response.status}): ${errorMessage}`)
        }

        return response.json() as Promise<T>
      }

      return {
        check: async (params: ApiMethodParams): Promise<AutumnCheckResponse> => {
          const customerId = await getCustomerId(params)
          await ensureCustomer(customerId)

          const { featureId, productId } = params.body || {}

          if (!featureId && !productId) {
            throw new Error('Either featureId or productId is required')
          }

          const payload: Record<string, unknown> = { customer_id: customerId }
          if (featureId) payload.feature_id = featureId
          if (productId) payload.product_id = productId

          return autumnRequest<AutumnCheckResponse>('/check', 'POST', payload)
        },

        track: async (params: ApiMethodParams): Promise<AutumnTrackResponse> => {
          const customerId = await getCustomerId(params)
          const { featureId, value = 1 } = params.body || {}

          if (!featureId) {
            throw new Error('featureId is required')
          }

          return autumnRequest<AutumnTrackResponse>('/track', 'POST', {
            customer_id: customerId,
            feature_id: featureId,
            value,
          })
        },

        checkout: async (params: ApiMethodParams): Promise<AutumnCheckoutResponse> => {
          const customerId = await getCustomerId(params)
          const { productId, successUrl } = params.body || {}

          if (!productId) {
            throw new Error('productId is required')
          }

          const payload: Record<string, unknown> = {
            customer_id: customerId,
            product_id: productId,
          }
          if (successUrl) payload.success_url = successUrl

          return autumnRequest<AutumnCheckoutResponse>('/checkout', 'POST', payload)
        },

        getCustomer: async (params: ApiMethodParams): Promise<AutumnCustomerResponse> => {
          const customerId = await getCustomerId(params)
          return autumnRequest<AutumnCustomerResponse>(`/customers/${customerId}`, 'GET')
        },

        attach: async (params: ApiMethodParams): Promise<AutumnAttachResponse> => {
          const customerId = await getCustomerId(params)
          const { productId, successUrl, cancelUrl } = params.body || {}

          if (!productId) {
            throw new Error('productId is required')
          }

          const payload: Record<string, unknown> = {
            customer_id: customerId,
            product_id: productId,
          }
          if (successUrl) payload.success_url = successUrl
          if (cancelUrl) payload.cancel_url = cancelUrl

          return autumnRequest<AutumnAttachResponse>('/attach', 'POST', payload)
        },

        cancel: async (params: ApiMethodParams): Promise<AutumnCancelResponse> => {
          const customerId = await getCustomerId(params)
          const { productId } = params.body || {}

          const payload: Record<string, unknown> = { customer_id: customerId }
          if (productId) payload.product_id = productId

          return autumnRequest<AutumnCancelResponse>('/cancel', 'POST', payload)
        },

        getBillingPortal: async (params: ApiMethodParams): Promise<AutumnBillingPortalResponse> => {
          const customerId = await getCustomerId(params)
          const { returnUrl } = params.body || {}

          const payload: Record<string, unknown> = {}
          if (returnUrl) payload.return_url = returnUrl

          return autumnRequest<AutumnBillingPortalResponse>(`/customers/${customerId}/billing_portal`, 'POST', payload)
        },

        createEntity: async (params: ApiMethodParams): Promise<AutumnEntityResponse> => {
          const customerId = await getCustomerId(params)
          const { entities } = params.body || {}

          if (!entities) {
            throw new Error('entities array is required')
          }

          const payload = Array.isArray(entities) ? entities : [entities]
          return autumnRequest<AutumnEntityResponse>(`/customers/${customerId}/entities`, 'POST', payload)
        },

        getEntity: async (params: ApiMethodParams): Promise<AutumnEntityResponse> => {
          const customerId = await getCustomerId(params)
          const { entityId } = params.body || {}

          if (!entityId) {
            throw new Error('entityId is required')
          }

          return autumnRequest<AutumnEntityResponse>(`/customers/${customerId}/entities/${entityId}`, 'GET')
        },

        query: async (params: ApiMethodParams): Promise<AutumnQueryResponse> => {
          const customerId = await getCustomerId(params)
          const { featureId, startDate, endDate } = params.body || {}

          const payload: Record<string, unknown> = { customer_id: customerId }
          if (featureId) payload.feature_id = featureId
          if (startDate) payload.start_date = startDate
          if (endDate) payload.end_date = endDate

          return autumnRequest<AutumnQueryResponse>('/query', 'POST', payload)
        },

        /**
         * Clear customer cache - useful when a customer is deleted
         * Accepts customerId directly or gets it from params
         */
        clearCustomerCache: async (customerIdOrParams: string | ApiMethodParams): Promise<void> => {
          const customerId = typeof customerIdOrParams === 'string'
            ? customerIdOrParams
            : await getCustomerId(customerIdOrParams)

          // Only clear if storage is provided
          if (storage) {
            const cacheKey = `autumn:customer:${customerId}`
            await storage.delete(cacheKey)
          }
        },
      }
    },
  }
}
