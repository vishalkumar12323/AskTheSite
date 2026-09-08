import express from "express";
import cors from "cors";

import taskRoutes from "./routes/task.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";

const app = express();

// requestLogger must be the FIRST middleware so it sees every request,
// including those that fail before reaching a controller.
app.use(requestLogger);
app.use(cors());
app.use(express.json());

app.use("/api/tasks", taskRoutes);
app.use("/api/conversations", conversationRoutes);

app.use(errorHandler);

app.get("/api/health", (req, res) => {
  res.status(200).json({ msg: "api server successfully running...", host: req.hostname, currentTime: new Date().toISOString() });
});

export { app };
