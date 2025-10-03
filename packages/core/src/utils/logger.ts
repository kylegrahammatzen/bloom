import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const createLogger = (config?: { level?: string; enabled?: boolean }) => {
  if (config?.enabled === false) {
    return pino({ enabled: false });
  }

  return pino({
    level: config?.level || (isDevelopment ? 'debug' : 'info'),
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  });
};

export const logger = createLogger();
