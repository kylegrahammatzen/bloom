import { RedisStorage } from '@bloom/core';

const redisStorage = new RedisStorage({
  url: process.env.REDIS_URL!,
  poolSize: 10,
  namespace: 'bloom',
});

await redisStorage.connect();

export { redisStorage };
