import type { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { BloomServerConfig } from '@/schemas/server';

export function setupHelmet(app: Application, config: BloomServerConfig) {
  if (config.helmet !== false) {
    const helmetOptions = typeof config.helmet === 'object' ? config.helmet : {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    };
    app.use(helmet(helmetOptions));
  }
}

export function setupCors(app: Application, config: BloomServerConfig) {
  if (config.cors !== false) {
    const corsOptions = typeof config.cors === 'object' ? config.cors : {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      optionsSuccessStatus: 200,
    };
    app.use(cors(corsOptions));
  }
}

export function setupCookieParser(app: Application) {
  app.use(cookieParser());
}
