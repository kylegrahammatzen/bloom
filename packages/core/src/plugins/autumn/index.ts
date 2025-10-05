import type { BloomPlugin, BloomAuth, ApiMethodParams } from '@/schemas';
import { parseSessionCookie } from '@/schemas/session';
import { APIError, APIErrorCode } from '@/schemas/errors';

/**
 * Autumn plugin configuration
 */
export type AutumnConfig = {
  /**
   * Autumn API secret key
   * Get from https://app.useautumn.com/ under "Developer"
   */
  apiKey?: string;

  /**
   * Autumn API URL (for self-hosted instances)
   * @default "https://api.useautumn.com"
   */
  apiUrl?: string;
}

/**
 * Autumn API response types
 */
export type AutumnCheckResponse = {
  data: {
    allowed: boolean;
    remaining?: number;
    limit?: number;
  };
}

export type AutumnTrackResponse = {
  success: boolean;
}

export type AutumnCheckoutResponse = {
  url: string; // Stripe checkout URL
}

export type AutumnAttachResponse = {
  success: boolean;
  url?: string; // Stripe checkout URL if payment required
}

export type AutumnCancelResponse = {
  success: boolean;
}

export type AutumnBillingPortalResponse = {
  url: string; // Stripe billing portal URL
}

export type AutumnEntityResponse = {
  id: string;
  feature_id: string;
  customer_id: string;
  data?: Record<string, any>;
}

export type AutumnQueryResponse = {
  data: {
    feature_id?: string;
    usage: number;
    limit?: number;
    period_start?: string;
    period_end?: string;
  }[];
}

export type AutumnCustomerResponse = {
  id: string;
  plan?: string;
  usage?: Record<string, {
    used: number;
    limit?: number;
    remaining?: number;
  }>;
  subscription?: {
    status: string;
    current_period_start?: string;
    current_period_end?: string;
  };
}

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
  return {
    name: 'autumn',
    init: (auth: BloomAuth) => {
      const apiKey = config.apiKey || process.env.AUTUMN_SECRET_KEY;
      const apiUrl = config.apiUrl || process.env.AUTUMN_API_URL || 'https://api.useautumn.com/v1';
      const cookieName = auth.config.session?.cookieName || 'bloom.sid';

      if (!apiKey) {
        throw new Error('Autumn API key is required. Set AUTUMN_SECRET_KEY environment variable or pass apiKey in config.');
      }

      /**
       * Get user ID from session cookie
       */
      const getUserId = (params: ApiMethodParams): string => {
        const cookieValue = params.headers?.['cookie'] || params.headers?.['Cookie'];

        if (!cookieValue || typeof cookieValue !== 'string') {
          throw new APIError(APIErrorCode.NOT_AUTHENTICATED);
        }

        const cookies = parseCookies(cookieValue);
        const sessionCookie = cookies[cookieName];

        if (!sessionCookie) {
          throw new APIError(APIErrorCode.NOT_AUTHENTICATED);
        }

        const sessionData = parseSessionCookie(sessionCookie);
        if (!sessionData) {
          throw new APIError(APIErrorCode.NOT_AUTHENTICATED);
        }

        return sessionData.userId;
      };

      /**
       * Make request to Autumn API
       */
      const autumnRequest = async <T = any>(endpoint: string, method: string = 'POST', body?: any): Promise<T> => {
        const url = `${apiUrl}${endpoint}`;
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = response.statusText;

          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorText;
          } catch {
            errorMessage = errorText || response.statusText;
          }

          console.error(`[Autumn API] ${method} ${url} failed:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
          });

          throw new Error(`Autumn API error (${response.status}): ${errorMessage}`);
        }

        return response.json() as Promise<T>;
      };

      auth.api.autumn = {
        /**
         * Check if user has access to a feature or product
         */
        check: async (params: ApiMethodParams): Promise<AutumnCheckResponse> => {
          const userId = getUserId(params);
          const { featureId, productId } = params.body || {};

          if (!featureId && !productId) {
            throw new APIError(APIErrorCode.INVALID_INPUT, 'Either featureId or productId is required');
          }

          const payload: any = { customer_id: userId };
          if (featureId) payload.feature_id = featureId;
          if (productId) payload.product_id = productId;

          return autumnRequest<AutumnCheckResponse>('/check', 'POST', payload);
        },

        /**
         * Track usage of a feature
         */
        track: async (params: ApiMethodParams): Promise<AutumnTrackResponse> => {
          const userId = getUserId(params);
          const { featureId, value = 1 } = params.body || {};

          if (!featureId) {
            throw new APIError(APIErrorCode.INVALID_INPUT, 'featureId is required');
          }

          return autumnRequest<AutumnTrackResponse>('/track', 'POST', {
            customer_id: userId,
            feature_id: featureId,
            value,
          });
        },

        /**
         * Create checkout session for product purchase
         */
        checkout: async (params: ApiMethodParams): Promise<AutumnCheckoutResponse> => {
          const userId = getUserId(params);
          const { productId, successUrl, cancelUrl } = params.body || {};

          if (!productId) {
            throw new APIError(APIErrorCode.INVALID_INPUT, 'productId is required');
          }

          const payload: any = {
            customer_id: userId,
            product_id: productId,
          };

          if (successUrl) payload.success_url = successUrl;
          if (cancelUrl) payload.cancel_url = cancelUrl;

          return autumnRequest<AutumnCheckoutResponse>('/checkout', 'POST', payload);
        },

        /**
         * Get customer subscription and usage data
         */
        getCustomer: async (params: ApiMethodParams): Promise<AutumnCustomerResponse> => {
          const userId = getUserId(params);

          try {
            return await autumnRequest<AutumnCustomerResponse>(`/customers/${userId}`, 'GET');
          } catch (error: any) {
            // If customer doesn't exist (401/404), create them first
            if (error.message?.includes('401') || error.message?.includes('404')) {
              console.log('[Autumn] Customer not found, creating...');

              try {
                // Create the customer
                await autumnRequest('/customers', 'POST', {
                  id: userId,
                });
                console.log('[Autumn] Customer created successfully');

                // Fetch the newly created customer
                return await autumnRequest<AutumnCustomerResponse>(`/customers/${userId}`, 'GET');
              } catch (createError: any) {
                console.error('[Autumn] Failed to create customer:', createError.message);
                throw createError;
              }
            }

            throw error;
          }
        },

        /**
         * Attach product to customer (upgrade/downgrade)
         */
        attach: async (params: ApiMethodParams): Promise<AutumnAttachResponse> => {
          const userId = getUserId(params);
          const { productId, successUrl, cancelUrl } = params.body || {};

          if (!productId) {
            throw new APIError(APIErrorCode.INVALID_INPUT, 'productId is required');
          }

          const payload: any = {
            customer_id: userId,
            product_id: productId,
          };

          if (successUrl) payload.success_url = successUrl;
          if (cancelUrl) payload.cancel_url = cancelUrl;

          return autumnRequest<AutumnAttachResponse>('/attach', 'POST', payload);
        },

        /**
         * Cancel product subscription
         */
        cancel: async (params: ApiMethodParams): Promise<AutumnCancelResponse> => {
          const userId = getUserId(params);
          const { productId } = params.body || {};

          const payload: any = {
            customer_id: userId,
          };

          if (productId) payload.product_id = productId;

          return autumnRequest<AutumnCancelResponse>('/cancel', 'POST', payload);
        },

        /**
         * Get Stripe billing portal URL
         */
        getBillingPortal: async (params: ApiMethodParams): Promise<AutumnBillingPortalResponse> => {
          const userId = getUserId(params);
          const { returnUrl } = params.body || {};

          const payload: any = {
            customer_id: userId,
          };

          if (returnUrl) payload.return_url = returnUrl;

          return autumnRequest<AutumnBillingPortalResponse>('/billing-portal', 'POST', payload);
        },

        /**
         * Create entity (seats, workspaces, etc.)
         */
        createEntity: async (params: ApiMethodParams): Promise<AutumnEntityResponse> => {
          const userId = getUserId(params);
          const { entityFeatureId, data } = params.body || {};

          if (!entityFeatureId) {
            throw new APIError(APIErrorCode.INVALID_INPUT, 'entityFeatureId is required');
          }

          const payload: any = {
            customer_id: userId,
            entity_feature_id: entityFeatureId,
          };

          if (data) payload.data = data;

          return autumnRequest<AutumnEntityResponse>('/entity', 'POST', payload);
        },

        /**
         * Get entity information
         */
        getEntity: async (params: ApiMethodParams): Promise<AutumnEntityResponse> => {
          const userId = getUserId(params);
          const { entityId } = params.body || {};

          if (!entityId) {
            throw new APIError(APIErrorCode.INVALID_INPUT, 'entityId is required');
          }

          return autumnRequest<AutumnEntityResponse>(`/entity/${entityId}?customer_id=${userId}`, 'GET');
        },

        /**
         * Query usage data
         */
        query: async (params: ApiMethodParams): Promise<AutumnQueryResponse> => {
          const userId = getUserId(params);
          const { featureId, startDate, endDate } = params.body || {};

          const payload: any = {
            customer_id: userId,
          };

          if (featureId) payload.feature_id = featureId;
          if (startDate) payload.start_date = startDate;
          if (endDate) payload.end_date = endDate;

          return autumnRequest<AutumnQueryResponse>('/query', 'POST', payload);
        },
      };
    }
  };
};

/**
 * Simple cookie parser helper
 */
function parseCookies(cookieString: string): Record<string, string> {
  return cookieString.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
}
