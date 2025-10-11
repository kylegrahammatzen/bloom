import { bloomFetch, setConfig } from '@/client/fetch'
import type { BloomClient, ClientConfig, AuthMethods, BloomResponse, User, Session } from '@/client/types'

/**
 * Create a Bloom client instance
 *
 * @example
 * import { bloomClient } from '@bloom/core-v2/client'
 *
 * const client = bloomClient({ baseUrl: '/auth' })
 *
 * const { data, error } = await client.auth.login({ email, password })
 */
export function bloomClient(props?: ClientConfig): BloomClient {
  if (props) {
    setConfig(props)
  }

  // Generic method factory
  const createMethod = <T>(path: string, method: 'GET' | 'POST' | 'DELETE') =>
    async (bodyOrId?: any): Promise<BloomResponse<T>> => {
      const finalPath = typeof bodyOrId === 'string' && path.includes('/:')
        ? path.replace(/:\w+/, bodyOrId)
        : path

      return bloomFetch<T>({
        path: finalPath,
        options: {
          method,
          body: method !== 'GET' && bodyOrId && typeof bodyOrId !== 'string'
            ? JSON.stringify(bodyOrId)
            : undefined,
        },
      })
    }

  const auth: AuthMethods = {
    register: createMethod<{ user: User; session: Session }>('/register', 'POST'),
    login: createMethod<{ user: User; session: Session }>('/login', 'POST'),
    logout: createMethod<{ message: string }>('/logout', 'POST'),
    getSession: createMethod<{ user: User; session: Session }>('/session', 'GET'),
    getSessions: createMethod<Session[]>('/sessions', 'GET'),
    deleteSession: createMethod<{ message: string }>('/sessions/:id', 'DELETE'),
    deleteAllSessions: createMethod<{ message: string }>('/sessions', 'DELETE'),
    sendVerificationEmail: createMethod<{ message: string }>('/send-verification-email', 'POST'),
    verifyEmail: createMethod<{ message: string }>('/verify-email', 'POST'),
    requestPasswordReset: createMethod<{ message: string }>('/request-password-reset', 'POST'),
    resetPassword: createMethod<{ message: string }>('/reset-password', 'POST'),
  }

  // Build client with auth methods
  const client: BloomClient = {
    auth,
  }

  // Add plugin methods if plugins are provided
  if (props?.plugins) {
    for (const plugin of props.plugins) {
      if (plugin.getActions) {
        const pluginActions = plugin.getActions(bloomFetch)
        Object.assign(client, pluginActions)
      }
    }
  }

  return client
}
