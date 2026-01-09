import { db } from "@db/index.js";
import { answer, tasks } from "@db/db/schema.js";
import { eq } from "drizzle-orm";

export const markProcessing = async (taskId: string) => {
  await db
    .update(tasks)
    .set({ status: "PROCESSING" })
    .where(eq(tasks.id, taskId));
};

export const markCompleted = async (taskId: string, aiAnswer: string) => {
  await db.transaction(async(tx) => {
    await tx.update(tasks).set({status: "COMPLETED"}).where(eq(tasks.id, taskId));
    await tx.insert(answer).values({aiAnswer, taskId});
  });
};

export const markFailed = async (taskId: string, errMessage: string) => {
  await db.transaction(async(tx) => {
    await tx.update(tasks).set({status: "FAILED"}).where(eq(tasks.id, taskId));
    await tx.insert(answer).values({errMessage, taskId});
  });
};
