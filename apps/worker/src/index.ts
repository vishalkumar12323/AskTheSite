import { Worker } from "bullmq";
import { redisConnection } from "./config/redis.js";
import { processTaskJobs } from "./processor.js";

const TASK_QUEUE_NAME = "task-queue";

new Worker(
  TASK_QUEUE_NAME,
  async (job) => {
    await processTaskJobs(job.data.id);
  },
  {
    connection: redisConnection,
  }
);

console.log("Worker running and waiting for jobs...");
