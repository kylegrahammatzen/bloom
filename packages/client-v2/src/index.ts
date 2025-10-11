export { createClient } from './client'
export { bloomFetch, setConfig, getConfig } from './fetch'
export { autumnClient } from './plugins/autumn'
export type { AutumnMethods } from './plugins/autumn'
export type {
  BloomClient,
  BloomResponse,
  BloomError,
  ClientConfig,
  ClientPlugin,
  AuthMethods,
  User,
  Session,
} from './types'
