import type { BloomAuth } from './handler';

/**
 * Plugin system interface
 */
export type BloomPlugin = {
  name: string;
  init?: (auth: BloomAuth) => void | Promise<void>;
}
