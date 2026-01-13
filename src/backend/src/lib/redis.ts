import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let initPromise: Promise<RedisClientType> | null = null;

const isTestEnv = process.env.NODE_ENV === 'test';

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = process.env.REDIS_PORT ?? '6379';
  return `redis://${host}:${port}`;
};

const getClient = async () => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    client = createClient({
      url: getRedisUrl(),
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('error', (error: unknown) => {
      console.error('Redis client error:', error);
    });

    await client.connect();
    return client as RedisClientType;
  })();

  return initPromise;
};

export const getCache = async (key: string) => {
  if (isTestEnv) {
    return null;
  }

  try {
    const redis = await getClient();
    return await redis.get(key);
  } catch (error) {
    console.error(`Redis get failed for ${key}:`, error);
    return null;
  }
};

export const setCache = async (key: string, value: string, ttlSeconds: number) => {
  if (isTestEnv) {
    return;
  }

  try {
    const redis = await getClient();
    await redis.set(key, value, { EX: ttlSeconds });
  } catch (error) {
    console.error(`Redis set failed for ${key}:`, error);
  }
};

export const deleteCache = async (key: string) => {
  if (isTestEnv) {
    return;
  }

  try {
    const redis = await getClient();
    await redis.del(key);
  } catch (error) {
    console.error(`Redis delete failed for ${key}:`, error);
  }
};

export const deleteByPattern = async (pattern: string) => {
  if (isTestEnv) {
    return;
  }

  try {
    const redis = await getClient();
    for await (const key of redis.scanIterator({ MATCH: pattern })) {
      const cacheKey = Array.isArray(key) ? key[0] : key;
      if (typeof cacheKey === 'string') {
        await redis.del(cacheKey);
      }
    }
  } catch (error) {
    console.error(`Redis pattern delete failed for ${pattern}:`, error);
  }
};
