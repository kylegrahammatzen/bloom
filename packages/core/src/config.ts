import { BloomConfigSchema, type BloomAuthConfig } from '@/schemas/config';

export type { BloomAuthConfig };

/**
 * Creates a validated configuration with defaults
 */
export function createDefaultConfig(config: Partial<BloomAuthConfig> = {}): BloomAuthConfig {
  return BloomConfigSchema.parse(config);
}
