import { db } from "../../database/src/index.js";
import { tasks } from "../../database/src/db/schema.js";
import { eq } from "drizzle-orm";

import {
  markCompleted,
  markFailed,
  markProcessing,
} from "./services/task.services.js";
import { askAI } from "./services/ai.service.js";
import { scrapeWebsite } from "./services/scrape.service.js";

export const processTaskJobs = async (taskId: string) => {
  try {
    const task = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) throw new Error("Task not found.");

    await markProcessing(taskId);

    const webContent = await scrapeWebsite(task[0].url);
    console.log("webContent: ", webContent);

    // const aiAns = await askAI(webContent, task[0].question);

    // console.log("answer: ", aiAns);

    // await markCompleted(taskId, aiAns);
  } catch (error: any) {
    console.error("❌ Job failed:", error);
    await markFailed(taskId, error.message);

    throw error;
  }
};
