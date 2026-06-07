import { Worker } from "bullmq";
import { redisConnection } from "./config/redis.js";
import { processTaskJobs } from "./processor.js";
import { logger } from "./logger/logger.js";

const TASK_QUEUE_NAME = "task-queue";

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
    connection: redisConnection,
  }
);

logger.system("Worker started — waiting for jobs", { queue: TASK_QUEUE_NAME });

