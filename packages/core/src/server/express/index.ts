import express, { type Application } from 'express';
import session from 'express-session';
import { bloomAuth } from '@/auth';
import type { BloomServerConfig, BloomServerInstance } from '@/types/server';
import { toExpressHandler, requireAuth } from '@/server/express/handlers';
import { setupHelmet, setupCors, setupCookieParser } from '@/server/express/middleware';
import { createSessionStore, getSessionOptions } from '@/server/express/session';
import { setupHealthRoute, setupErrorHandler } from '@/server/express/routes';
import { connectDatabase } from '@/server/express/database';
import { logger } from '@/utils/logger';
import '@/server/express/types';

type ValidatedConfig = BloomServerConfig & {
  database: { uri: string };
  session: { secret: string };
};

function validateConfig(config: BloomServerConfig): asserts config is ValidatedConfig {
  if (!config.database?.uri) {
    throw new Error('Database URI is required. Please provide config.database.uri');
  }

  if (!config.session?.secret) {
    throw new Error('Session secret is required. Please provide config.session.secret');
  }

  if (config.sessionStore?.type === 'redis' && !config.sessionStore?.uri) {
    throw new Error('Redis URI is required when using Redis session store. Please provide config.sessionStore.uri');
  }
}

export function bloomServer(config: BloomServerConfig): BloomServerInstance {
  validateConfig(config);

  const app: Application = express();
  const auth = bloomAuth(config);

  setupHelmet(app, config);
  setupCors(app, config);
  setupCookieParser(app);

  const store = createSessionStore(config);
  app.use(session(getSessionOptions(config, store)));

  app.all('/api/auth/*', toExpressHandler(auth));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  setupHealthRoute(app);
  setupErrorHandler(app);

  const addRoute = (path: string, handler: any, options?: { protected?: boolean }) => {
    if (options?.protected) {
      app.use(path, requireAuth(), handler);
    } else {
      app.use(path, handler);
    }
  };

  const start = async (port?: number) => {
    const serverPort = port || config.port || parseInt(process.env.PORT || '5000', 10);

    try {
      await connectDatabase(config.database.uri);

      app.listen(serverPort, () => {
        logger.info(`Bloom authentication server running on port ${serverPort}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);

        if (config.onReady) {
          config.onReady(serverPort);
        }
      });

    } catch (error) {
      logger.error({ error }, 'Failed to start server');
      process.exit(1);
    }
  };

  return {
    app,
    auth,
    addRoute,
    start,
  };
}
