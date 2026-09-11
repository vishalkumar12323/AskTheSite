import { Worker } from "bullmq";
import { redisClient } from "./config/redis.js";
import { processTaskJobs } from "./processor.js";
import { logger } from "./logger/logger.js";
import { startHealthServer } from "./health-server.js";

const TASK_QUEUE_NAME = "task-queue";

// Start lightweight HTTP server for health-check
startHealthServer();

new Worker(
  TASK_QUEUE_NAME,
  async (job) => {
    logger.worker(`Job received from queue`, {
      name: job.name,
      jobId: job.id,
      taskId: job.data.id,
    });
    await processTaskJobs(job.data.id);
  },
  {
    connection: redisClient,
  }
);

logger.system("Worker started — waiting for jobs", { queue: TASK_QUEUE_NAME });

