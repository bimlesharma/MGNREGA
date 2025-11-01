import { createClient } from 'redis';

function getRedisUrl() {
  return process.env.REDIS_URL || 'redis://localhost:6379';
}

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (redisClient && redisClient.isReady) {
    return redisClient;
  }

  redisClient = createClient({
    url: getRedisUrl(),
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));

  await redisClient.connect();
  return redisClient;
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600) {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function invalidateCache(pattern: string) {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Redis invalidate error:', error);
  }
}
