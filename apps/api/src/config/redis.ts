import { Redis } from "ioredis";
import { env } from "./env.js";

// Normalise REDIS_URL: if the value has no scheme, prepend rediss://
// (AWS ElastiCache / Valkey Serverless only accepts TLS connections)
function normaliseRedisUrl(raw: string): string {
  if (/^rediss?:\/\//i.test(raw)) return raw;
  // Bare hostname (or host:port) — assume AWS TLS endpoint
  return `rediss://${raw}`;
}

const REDIS_URL = normaliseRedisUrl(env.REDIS_URL);

// Plain options object for BullMQ's `connection` field.
// BullMQ v5 bundles its own ioredis internally and expects ConnectionOptions,
// not a pre-created Redis instance, to avoid version-mismatch type errors.
export const redisConnectionOptions = {
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
  // ioredis can parse a Redis URL when passed as the `url` option
  // but BullMQ's ConnectionOptions uses host/port. Parse manually:
  ...((): { host: string; port: number; password?: string; tls?: object } => {
    const url = new URL(REDIS_URL);
    return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
      ...(url.protocol === "rediss:" ? { tls: {} } : {}),
    };
  })(),
};

// Shared ioredis instance for non-BullMQ usage (e.g., caching, pub/sub)
export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  // Enable TLS for AWS ElastiCache Serverless (rediss:// scheme)
  ...(REDIS_URL.startsWith("rediss://") ? { tls: {} } : {}),
});
