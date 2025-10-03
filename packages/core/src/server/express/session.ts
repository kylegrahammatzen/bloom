import { type SessionOptions } from 'express-session';
import MongoStore from 'connect-mongo';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import type { BloomServerConfig } from '@/types/server';

export function createSessionStore(config: BloomServerConfig): RedisStore | MongoStore | undefined {
  const storeType = config.sessionStore?.type || 'redis';

  if (storeType === 'redis') {
    const redisClient = createClient({
      url: config.sessionStore?.uri,
    });

    redisClient.connect().catch(console.error);
    return new RedisStore({ client: redisClient, prefix: 'bloom:' });
  } else if (storeType === 'mongo') {
    const mongoUri = config.database?.uri;
    return MongoStore.create({
      mongoUrl: mongoUri,
      touchAfter: 24 * 3600,
    });
  }

  return undefined;
}

export function getSessionOptions(config: BloomServerConfig, store: RedisStore | MongoStore | undefined): SessionOptions {
  const sessionSecret = config.session?.secret;
  const sessionCookieName = config.session?.cookieName || 'bloom.sid';
  const sessionMaxAge = config.session?.expiresIn || 7 * 24 * 60 * 60 * 1000;

  return {
    secret: sessionSecret!,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: sessionMaxAge,
      sameSite: 'lax',
    },
    name: sessionCookieName,
  };
}
