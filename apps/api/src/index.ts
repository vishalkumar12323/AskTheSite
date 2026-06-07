import "module-alias/register.js";
import { app } from "./app.js";
import { env } from "./config/env.js";
import http from "http";
import { setupSocketServer } from "./wsServer.js";
import { logger } from "./logger/logger.js";

const server = http.createServer(app);
setupSocketServer(server);

server.listen(env.PORT, () => {
  logger.system(`API + WebSocket server started`, { port: env.PORT });
});