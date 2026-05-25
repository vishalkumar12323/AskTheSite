import { db } from "@db/index.js";
import { tasks } from "@db/db/schema.js";
import { eq } from "drizzle-orm";

import {
  markCompleted,
  markFailed,
  markProcessing,
} from "./services/task.services.js";
import { askAI } from "./services/ai.service.js";
import { scrapeWebsite } from "./services/scrape.service.js";

import { redisConnection } from "./config/redis.js"

export const processTaskJobs = async (taskId: string) => {
  try {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      columns: {
        id: true
      },
      with: {
        question: {
          columns: {
            url: true,
            question: true,
          }
        }
      }
    });

    if (!task) throw new Error("Task not found.");

    await markProcessing(taskId);
    await redisConnection.publish(`task:${taskId}`, JSON.stringify({
      status: "PROCESSING",
      stage: "ANALYZING",
      progress: 25
    }));

    const webContent = await scrapeWebsite(task.question.url);
    await redisConnection.publish(`task:${taskId}`, JSON.stringify({
      status: "PROCESSING",
      stage: "SCRAPING",
      progress: 40
    }));


    const aiAns = await askAI(webContent, task.question.question);

    await redisConnection.publish(`task:${taskId}`, JSON.stringify({
      status: "PROCESSING",
      stage: "AI_THINKING",
      progress: 60
    }));

    await markCompleted(taskId, aiAns);

    await redisConnection.publish(`task:${taskId}`, JSON.stringify({
      status: "COMPLETED",
      stage: "GENERATING",
      progress: 100
    }));
  } catch (error: any) {
    console.error("❌ Job failed:", error);
    await markFailed(taskId, error.message);
    await redisConnection.publish(`task:${taskId}`, JSON.stringify({
      status: "FAILED",
      error: error.message
    }));

    throw error;
  }
};
