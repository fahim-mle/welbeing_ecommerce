import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let connectionPromise: Promise<RedisClientType> | null = null;

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = process.env.REDIS_PORT ?? '6379';
  return `redis://${host}:${port}`;
};

const getClient = async () => {
  if (!client) {
    client = createClient({
      url: getRedisUrl(),
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('error', (error: unknown) => {
      console.error('Redis client error:', error);
    });
  }

  if (!connectionPromise) {
    connectionPromise = client.connect().then(() => client as RedisClientType);
  }

  return connectionPromise;
};

export const getCache = async (key: string) => {
  try {
    const redis = await getClient();
    return await redis.get(key);
  } catch (error) {
    console.error(`Redis get failed for ${key}:`, error);
    return null;
  }
};

export const setCache = async (key: string, value: string, ttlSeconds: number) => {
  try {
    const redis = await getClient();
    await redis.set(key, value, { EX: ttlSeconds });
  } catch (error) {
    console.error(`Redis set failed for ${key}:`, error);
  }
};

export const deleteCache = async (key: string) => {
  try {
    const redis = await getClient();
    await redis.del(key);
  } catch (error) {
    console.error(`Redis delete failed for ${key}:`, error);
  }
};

export const deleteByPattern = async (pattern: string) => {
  try {
    const redis = await getClient();
    for await (const key of redis.scanIterator({ MATCH: pattern })) {
      await redis.del(key as string);
    }
  } catch (error) {
    console.error(`Redis pattern delete failed for ${pattern}:`, error);
  }
};
