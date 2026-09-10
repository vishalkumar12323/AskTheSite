import { Redis, Cluster } from "ioredis";
import { env } from "./env.js";

// Parse the redis url or endpoint to Accepts multiple formats:
function parseRedisEndpoint(raw: string): {
  host: string;
  port: number;
  tls: boolean
} {
  const stripped = raw.replace(/^rediss?:\/\//i, "");
  const hostPort = stripped.split("/")[0];
  const parts = hostPort.split(":");
  const host = parts[0];
  const port = parts[1] ? Number(parts[1]) : 6379;

  const tls = /^rediss:\/\//i.test(raw) || host.endsWith(".cache.amazonaws.com");

  return { host, port, tls };
}

const { host: REDIS_HOST, port: REDIS_PORT, tls: USE_TLS } = parseRedisEndpoint(env.REDIS_URL);

const IS_CLUSTER = REDIS_HOST.endsWith(".cache.amazonaws.com");

const tlsOptions = USE_TLS ? { tls: { servername: REDIS_HOST } } : {};

export const redisConnectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
  ...tlsOptions
}

function createClient(): Redis | Cluster {
  if (IS_CLUSTER) {
    return new Cluster([{ host: REDIS_HOST, port: REDIS_PORT }], {
      enableReadyCheck: false,
      slotsRefreshTimeout: 10_000,
      redisOptions: {
        maxRetriesPerRequest: null,
        ...tlsOptions
      }
    })
  }

  return new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...tlsOptions
  });
};

export const redisClient: Redis | Cluster = createClient();

export const redisSubscriber: Redis | Cluster = createClient();
