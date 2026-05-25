import "module-alias/register.js";
import { app } from "./app.js";
import { env } from "./config/env.js";
import http from "http";
import { setupSocketServer } from "./wsServer.js";


const server = http.createServer(app);
setupSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`API + WebSocket server running on port ${env.PORT}`);
});