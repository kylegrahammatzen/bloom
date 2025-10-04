import express, { type Application } from 'express';
import { bloomAuth } from '@bloom/core';
import type { BloomServerConfig, BloomServerInstance } from '@bloom/core/schemas/server';
import { toExpressHandler, requireAuth } from './handlers';
import { setupHelmet, setupCors, setupCookieParser } from './middleware';
import { setupHealthRoute, setupErrorHandler } from './routes';

export function bloomServer(config: BloomServerConfig): BloomServerInstance {
  if (!config.session?.secret) {
    throw new Error('Session secret is required. Please provide config.session.secret');
  }

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

    app.listen(serverPort, () => {
      if (config.onReady) {
        config.onReady(serverPort);
      }
    });
  };

  return {
    app,
    auth,
    addRoute,
    start,
  };
}
