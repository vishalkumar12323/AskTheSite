/**
 * health-server.ts
 *
 * A minimal HTTP server that runs alongside the BullMQ worker.
 * Healthcheck command to use in ECS task definition:
 *   CMD-SHELL, curl -f http://localhost:3001/health || exit 1
*/

import { createServer, IncomingMessage, ServerResponse } from "http";
import { redisClient } from "./config/redis.js";
import { logger } from "./logger/logger.js";

const HEALTH_PORT = process.env.HEALTH_PORT ? Number(process.env.HEALTH_PORT) : 3001;

async function checkRedis(): Promise<boolean> {
  try {
    const result = await redisClient.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

export function startHealthServer(): void {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "GET" && req.url === "/health") {
      const redisOk = await checkRedis();

      if (redisOk) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", redis: "connected", ts: new Date().toISOString() }));
      } else {
        // Return 503 so ECS marks the task unhealthy and replaces it
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "unhealthy", redis: "disconnected", ts: new Date().toISOString() }));
      }
      return;
    }

    // Any other path → 404
    res.writeHead(404);
    res.end();
  });

  server.listen(HEALTH_PORT, "0.0.0.0", () => {
    logger.system(`Health server listening`, { port: HEALTH_PORT, path: "/health" });
  });

  // Don't let an uncaught health-server error crash the worker process
  server.on("error", (err) => {
    logger.system("Health server error", { error: (err as Error).message });
  });
}
