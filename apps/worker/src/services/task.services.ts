import { db } from "../../../database/src/index.js";
import { tasks } from "../../../database/src/db/schema.js";
import { eq } from "drizzle-orm";

export const markProcessing = async (taskId: string) => {
  await db
    .update(tasks)
    .set({ status: "PROCESSING" })
    .where(eq(tasks.id, taskId));
};

export const markCompleted = async (taskId: string, aiAnswer: string) => {
  await db
    .update(tasks)
    .set({ status: "COMPLETED", aiAnswer })
    .where(eq(tasks.id, taskId));
};

export const markFailed = async (taskId: string, errorMessage: string) => {
  await db
    .update(tasks)
    .set({ status: "FAILED", errorMessage })
    .where(eq(tasks.id, taskId));
};
