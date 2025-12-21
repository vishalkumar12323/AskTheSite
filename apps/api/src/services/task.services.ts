import { tasks } from "@db/db/schema.js";
import { db } from "@db/index.js";
import { eq } from "drizzle-orm";
import { addTaskToQueue } from "./queue.service.js";

export const createTaskService = async (url: string, question: string) => {
  const task: typeof tasks.$inferInsert = {
    url,
    question,
  };
  await db.insert(tasks).values(task);

  await addTaskToQueue(task.id!);
  return task;
};

export const getTaskService = async (id: string) => {
  const task = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) throw new Error("Task not found");
  return task;
};
