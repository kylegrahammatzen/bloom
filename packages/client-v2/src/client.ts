import { bloomFetch, setConfig } from './fetch'
import type { BloomClient, ClientConfig, AuthMethods, BloomResponse, User, Session } from './types'

/**
 * Create a Bloom client instance
 *
 * @example
 * import { createClient } from '@bloom/client-v2'
 *
 * const client = createClient({ baseUrl: '/auth' })
 *
 * const { data, error } = await client.auth.login({ email, password })
 */
export function createClient(props?: { config?: ClientConfig }): BloomClient {
  const config = props?.config

  if (config) {
    setConfig(config)
  }

  const auth: AuthMethods = {
    register: async (body) => {
      return bloomFetch<{ user: User; session: Session }>({
        path: '/register',
        options: {
          method: 'POST',
          body: JSON.stringify(body),
        },
      })
    },

    login: async (body) => {
      return bloomFetch<{ user: User; session: Session }>({
        path: '/login',
        options: {
          method: 'POST',
          body: JSON.stringify(body),
        },
      })
    },

    logout: async () => {
      return bloomFetch<{ message: string }>({
        path: '/logout',
        options: {
          method: 'POST',
        },
      })
    },

    getSession: async () => {
      return bloomFetch<{ user: User; session: Session }>({
        path: '/session',
        options: {
          method: 'GET',
        },
      })
    },

    getSessions: async () => {
      return bloomFetch<Session[]>({
        path: '/sessions',
        options: {
          method: 'GET',
        },
      })
    },

    deleteSession: async (id) => {
      return bloomFetch<{ message: string }>({
        path: `/sessions/${id}`,
        options: {
          method: 'DELETE',
        },
      })
    },

    deleteAllSessions: async () => {
      return bloomFetch<{ message: string }>({
        path: '/sessions',
        options: {
          method: 'DELETE',
        },
      })
    },

    sendVerificationEmail: async () => {
      return bloomFetch<{ message: string }>({
        path: '/send-verification-email',
        options: {
          method: 'POST',
        },
      })
    },

    verifyEmail: async (body) => {
      return bloomFetch<{ message: string }>({
        path: '/verify-email',
        options: {
          method: 'POST',
          body: JSON.stringify(body),
        },
      })
    },

    requestPasswordReset: async (body) => {
      return bloomFetch<{ message: string }>({
        path: '/request-password-reset',
        options: {
          method: 'POST',
          body: JSON.stringify(body),
        },
      })
    },

    resetPassword: async (body) => {
      return bloomFetch<{ message: string }>({
        path: '/reset-password',
        options: {
          method: 'POST',
          body: JSON.stringify(body),
        },
      })
    },
  }

  // Build client with auth methods
  const client: BloomClient = {
    auth,
  }

  // Add plugin methods if plugins are provided
  if (config?.plugins) {
    for (const plugin of config.plugins) {
      if (plugin.getActions) {
        const pluginActions = plugin.getActions(bloomFetch)
        Object.assign(client, pluginActions)
      }
    }
  }

  return client
}
