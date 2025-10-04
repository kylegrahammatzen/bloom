import type { BloomAuth } from './handler';

/**
 * Plugin API methods that will be merged into auth.api
 */
export type PluginApiMethods = {
  [namespace: string]: {
    [method: string]: (...args: any[]) => any;
  };
}

/**
 * Plugin system interface
 */
export type BloomPlugin = {
  name: string;
  api?: PluginApiMethods;
  init?: (auth: BloomAuth) => void | Promise<void>;
}
