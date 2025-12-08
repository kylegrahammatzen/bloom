import { bloomAuth, type Context } from '@bloom/core'
import { mongodbAdapter } from '@bloom/core/adapters/mongodb'
import { db } from './db'

export const auth = bloomAuth({
  adapter: mongodbAdapter(db),
  cookieName: 'bloom.sid',
  emailPassword: {
    minPasswordLength: 8,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60,
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    window: 60,
    max: 100,
    rules: {
      '/login': { window: 60, max: 5 },
      '/register': { window: 60, max: 3 },
    },
  },
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    prefix: '[Bloom]',
  },
  hooks: {
    '/register': {
      after: async (ctx: Context) => {
        console.log('[Hook] User registered:', { email: ctx.user?.email, id: ctx.user?.id })
      },
    },
    '/login': {
      after: async (ctx: Context) => {
        console.log('[Hook] User logged in:', { email: ctx.user?.email, id: ctx.user?.id })
      },
    },
  },
})
