export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type Logger = {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
};

export type LoggerConfig = {
  disabled?: boolean;
  level?: LogLevel;
  prefix?: string;
  colors?: boolean;
};

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

const levelColors: Record<LogLevel, string> = {
  info: colors.blue,
  warn: colors.yellow,
  error: colors.red,
  debug: colors.magenta,
};

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(currentLevel: LogLevel, messageLevel: LogLevel): boolean {
  return levelPriority[messageLevel] >= levelPriority[currentLevel];
}

function supportsColor(): boolean {
  if (typeof process === 'undefined') return false;
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  if (process.platform === 'win32') return true;
  if (process.env.TERM === 'dumb') return false;
  return process.stdout?.isTTY ?? false;
}

function formatMessage(
  level: LogLevel,
  message: string,
  prefix: string,
  useColors: boolean
): string {
  const timestamp = new Date().toISOString();
  const levelStr = level.toUpperCase();

  if (useColors) {
    return `${colors.dim}${timestamp}${colors.reset} ${levelColors[level]}${levelStr}${colors.reset} ${prefix} ${message}`;
  }

  return `${timestamp} ${levelStr} ${prefix} ${message}`;
}

export function createLogger(config: LoggerConfig = {}): Logger {
  const disabled = config.disabled ?? false;
  const level = config.level ?? 'error';
  const prefix = config.prefix ?? '[Bloom]';
  const useColors = config.colors ?? supportsColor();

  const log = (logLevel: LogLevel, message: string, meta?: Record<string, any>) => {
    if (disabled || !shouldLog(level, logLevel)) return;

    const formattedMessage = formatMessage(logLevel, message, prefix, useColors);
    const args = meta ? [formattedMessage, meta] : [formattedMessage];

    if (logLevel === 'error') {
      console.error(...args);
    } else if (logLevel === 'warn') {
      console.warn(...args);
    } else {
      console.log(...args);
    }
  };

  return {
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
    debug: (message, meta) => log('debug', message, meta),
  };
}

export const logger = createLogger();
