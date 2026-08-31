import { Queue } from "bullmq";
import { redisConnectionOptions } from "../config/redis.js";

export const TASK_QUEUE_NAME = "task-queue";

export const taskQueue = new Queue(TASK_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 1,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
