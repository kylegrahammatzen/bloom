import { BloomConfigSchema, type BloomAuthConfig } from '@/schemas/config';
import { createLogger, type Logger, type LoggerConfig } from '@/utils/logger';

export type { BloomAuthConfig };

export type NormalizedBloomAuthConfig = Omit<BloomAuthConfig, 'logger'> & {
  logger?: Logger;
};

/**
 * Creates a validated configuration with defaults
 */
export function createDefaultConfig(config: Partial<BloomAuthConfig> = {}): NormalizedBloomAuthConfig {
  const parsed = BloomConfigSchema.parse(config);

  // Create logger if LoggerConfig was provided, or use default
  let logger: Logger | undefined;
  if (parsed.logger && !('info' in parsed.logger)) {
    logger = createLogger(parsed.logger as LoggerConfig);
  } else if (parsed.logger && 'info' in parsed.logger) {
    logger = parsed.logger;
  } else {
    logger = createLogger();
  }

  return {
    ...parsed,
    logger,
  };
}
