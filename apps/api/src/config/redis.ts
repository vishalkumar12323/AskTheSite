import { Redis, Cluster } from "ioredis";
import { env } from "./env.js";

// ─── Parse endpoint ───────────────────────────────────────────────────────────
// Accepts any of these formats:
//   172.19.91.0:6379
//   redis://172.19.91.0:6379
//   rediss://askthesite-cache-dh37lk.serverless.aps1.cache.amazonaws.com:6379
//   askthesite-cache-dh37lk.serverless.aps1.cache.amazonaws.com          (bare)
function parseRedisEndpoint(raw: string): {
  host: string;
  port: number;
  tls: boolean;
} {
  const stripped = raw.replace(/^rediss?:\/\//i, "");
  const hostPort = stripped.split("/")[0];
  const parts = hostPort.split(":");
  const host = parts[0];
  const port = parts[1] ? Number(parts[1]) : 6379;
  // TLS required when using rediss:// scheme OR AWS ElastiCache hostname
  const tls =
    /^rediss:\/\//i.test(raw) || host.endsWith(".cache.amazonaws.com");
  return { host, port, tls };
}

const { host: REDIS_HOST, port: REDIS_PORT, tls: USE_TLS } =
  parseRedisEndpoint(env.REDIS_URL);

// AWS ElastiCache Serverless requires Redis Cluster mode.
// Plain local Redis (dev/WSL) runs in standalone mode.
const IS_CLUSTER = REDIS_HOST.endsWith(".cache.amazonaws.com");

const tlsOptions = USE_TLS ? { tls: { servername: REDIS_HOST } } : {};

// ─── BullMQ connection options ────────────────────────────────────────────────
// BullMQ v5 expects plain ConnectionOptions (host/port), not a pre-built client.
export const redisConnectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
  ...tlsOptions,
};

// ─── Factory: create the right client type based on IS_CLUSTER ────────────────
function createClient(): Redis | Cluster {
  if (IS_CLUSTER) {
    return new Cluster([{ host: REDIS_HOST, port: REDIS_PORT }], {
      enableReadyCheck: false,
      slotsRefreshTimeout: 10_000,
      redisOptions: {
        maxRetriesPerRequest: null,
        ...tlsOptions,
      },
    });
  }
  return new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...tlsOptions,
  });
}

// ─── Shared client for general use (caching, pub/sub publish, etc.) ───────────
export const redisClient: Redis | Cluster = createClient();

// ─── Dedicated subscriber client for pub/sub (Socket.IO) ─────────────────────
// A client in subscriber mode can ONLY run subscribe/unsubscribe commands,
// so it needs its own dedicated instance separate from redisClient.
export const redisSubscriber: Redis | Cluster = createClient();