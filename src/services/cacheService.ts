import { createClient, RedisClientType } from 'redis';
import config from '../config/env';

/**
 * Generic cache service for Redis operations
 * Handles get, set, delete operations with TTL support
 */

let redisClient: RedisClientType | null = null;

/**
 * Get or create Redis client
 */
const getRedisClient = async (): Promise<RedisClientType> => {
  if (redisClient) {
    return redisClient;
  }

  if (!config.cacheRedisUrl) {
    throw new Error('CACHE_REDIS_URL is not configured');
  }

  redisClient = createClient({ url: config.cacheRedisUrl });

  redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  await redisClient.connect();
  console.log('Redis client connected');

  return redisClient;
};

/**
 * Get value from cache
 */
export const getCached = async <T>(key: string): Promise<T | null> => {
  try {
    const client = await getRedisClient();
    const data = await client.get(key);

    if (data) {
      console.log(`Cache HIT: ${key}`);
      return JSON.parse(data) as T;
    }

    console.log(`Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.warn(`Cache read error for key "${key}":`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Set value in cache with TTL
 */
export const setCached = async <T>(
  key: string,
  value: T,
  ttlSeconds: number = config.cacheExpirationSecs
): Promise<void> => {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    console.log(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.warn(`Cache write error for key "${key}":`, error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Delete value from cache
 */
export const deleteCached = async (key: string): Promise<void> => {
  try {
    const client = await getRedisClient();
    await client.del(key);
    console.log(`Cache DELETED: ${key}`);
  } catch (error) {
    console.warn(`Cache delete error for key "${key}":`, error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Get or set cache with a fetch function
 * Pattern: Try cache first, if miss, call fetchFn, then cache result
 */
export const getOrSet = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = config.cacheExpirationSecs
): Promise<T> => {
  // Try cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch fresh data
  const freshData = await fetchFn();

  // Store in cache
  await setCached(key, freshData, ttlSeconds);

  return freshData;
};

/**
 * Close Redis connection (useful for graceful shutdown)
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis client disconnected');
  }
};
