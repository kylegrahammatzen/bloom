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

    const isJson = response.headers.get('content-type')?.includes('application/json')

    // Handle errors
    if (!response.ok) {
      const errorData = isJson ? (await response.json() as { error?: string; message?: string }) : null
      const error: BloomError = {
        code: errorData?.error || 'HTTP_ERROR',
        message: errorData?.message || response.statusText,
        status: response.status,
      }
      config.onError?.(error)
      return { data: null, error }
    }

    // Success - parse as T
    const data = isJson ? (await response.json() as T) : null
    config.onSuccess?.(data)
    return { data, error: null }
  } catch (err) {
    const error: BloomError = {
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Network error',
      status: 0,
    }
    config.onError?.(error)
    return { data: null, error }
  }
}
