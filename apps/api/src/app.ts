import express from "express";
import cors from "cors";

import taskRoutes from "./routes/task.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/tasks", taskRoutes);

app.use(errorHandler);

export { app };
