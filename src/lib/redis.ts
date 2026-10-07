import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

let client: Redis | null = null;

/** Shared lazy Redis connection. */
export function getRedis(): Redis {
  if (!client) {
    client = new Redis(config.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: false });
    client.on('error', (err) => logger.error({ err: err.message }, 'Redis error'));
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => undefined);
    client = null;
  }
}
