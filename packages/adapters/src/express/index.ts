import express, { type Application } from 'express';
import { bloomAuth } from '@bloom/core';
import type { BloomServerConfig, BloomServerInstance } from '@bloom/core/schemas/server';
import { toExpressHandler, requireAuth } from './handlers';
import { setupHelmet, setupCors, setupCookieParser } from './middleware';
import { setupHealthRoute, setupErrorHandler } from './routes';
import { connectDatabase } from './database';
import { logger } from '@bloom/core/utils/logger';

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
}

export function bloomServer(config: BloomServerConfig): BloomServerInstance {
  validateConfig(config);

  const app: Application = express();
  const auth = bloomAuth(config);

  setupHelmet(app, config);
  setupCors(app, config);
  setupCookieParser(app);

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

export { logger } from '@bloom/core/utils/logger';
