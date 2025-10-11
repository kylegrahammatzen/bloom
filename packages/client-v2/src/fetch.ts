import type { BloomResponse, BloomError, ClientConfig } from './types'

/**
 * Global client configuration
 */
let globalConfig: ClientConfig = {
  baseUrl: '/auth',
  credentials: 'include',
}

/**
 * Set global client configuration
 */
export function setConfig(config: ClientConfig) {
  globalConfig = { ...globalConfig, ...config }
}

/**
 * Get current global configuration
 */
export function getConfig(): ClientConfig {
  return globalConfig
}

/**
 * Make a fetch request to the Bloom API
 */
export async function bloomFetch<T>(
  params: { path: string; options?: RequestInit }
): Promise<BloomResponse<T>> {
  const config = getConfig()
  const url = `${config.baseUrl}${params.path}`

  try {
    const response = await fetch(url, {
      ...params.options,
      credentials: config.credentials,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
        ...params.options?.headers,
      },
    })

    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    // Handle error responses
    if (!response.ok) {
      const error: BloomError = isJson
        ? await response.json().then((json) => ({
            code: json.error || 'UNKNOWN_ERROR',
            message: json.message || 'An unknown error occurred',
            status: response.status,
          }))
        : {
            code: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
          }

      if (config.onError) {
        config.onError(error)
      }

      return { data: null, error }
    }

    // Handle success responses
    const data = isJson ? await response.json() : null

    if (data && config.onSuccess) {
      config.onSuccess(data)
    }

    return { data, error: null }
  } catch (err) {
    const error: BloomError = {
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Network error occurred',
      status: 0,
    }

    if (config.onError) {
      config.onError(error)
    }

    return { data: null, error }
  }
}
