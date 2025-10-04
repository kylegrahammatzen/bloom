import mongoose from 'mongoose';
import { RedisStorage } from '@bloom/core';

await mongoose.connect(process.env.DATABASE_URL!, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 1000,
  socketTimeoutMS: 45000,
});

const redisStorage = new RedisStorage({
  url: process.env.REDIS_URL!,
  poolSize: 10,
  namespace: 'bloom',
});

export { mongoose, redisStorage };
