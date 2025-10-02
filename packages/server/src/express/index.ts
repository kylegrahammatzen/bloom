import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { toExpressHandler, requireAuth } from '@bloom/node/dist/express';
import type { BloomServerConfig, BloomServerInstance } from '../types';

/**
 * Creates a zero-config Express server with Bloom authentication
 * @param config Server configuration including auth instance
 * @returns Server instance with app, addRoute, and start methods
 */
export function bloomServer(config: BloomServerConfig): BloomServerInstance {
  const app: Application = express();
  const { auth } = config;

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

  if (config.cors !== false) {
    const corsOptions = typeof config.cors === 'object' ? config.cors : {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      optionsSuccessStatus: 200,
    };
    app.use(cors(corsOptions));
  }

  app.use(cookieParser());

  const sessionSecret = auth.config.session?.secret || process.env.SESSION_SECRET || 'bloom-dev-secret-change-in-production';
  const sessionCookieName = auth.config.session?.cookieName || 'bloom.sid';
  const sessionMaxAge = auth.config.session?.expiresIn || 7 * 24 * 60 * 60 * 1000;
  const mongoUri = auth.config.database?.uri || process.env.MONGODB_URI || 'mongodb://bloom:bloom-dev-password@localhost:27017/bloom-auth';

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoUri,
      touchAfter: 24 * 3600,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: sessionMaxAge,
      sameSite: 'lax',
    },
    name: sessionCookieName,
  }));

  app.all('/api/auth/*', toExpressHandler(auth));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'bloom-auth-server',
      version: '1.0.0'
    });
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  });

  /**
   * Add a route to the server
   * @param path Route path
   * @param handler Route handler
   * @param options Options including protected flag
   */
  const addRoute = (path: string, handler: any, options?: { protected?: boolean }) => {
    if (options?.protected) {
      app.use(path, requireAuth(), handler);
    } else {
      app.use(path, handler);
    }
  };

  /**
   * Start the server
   * @param port Port number to listen on
   */
  const start = async (port?: number) => {
    const serverPort = port || config.port || parseInt(process.env.PORT || '5000', 10);

    try {
      if (!mongoose.connection.readyState) {
        await mongoose.connect(mongoUri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB successfully');
      }

      app.listen(serverPort, () => {
        console.log(`🚀 Bloom authentication server running on port ${serverPort}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);

        if (config.onReady) {
          config.onReady(serverPort);
        }
      });

      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  return {
    app,
    addRoute,
    start,
  };
}
